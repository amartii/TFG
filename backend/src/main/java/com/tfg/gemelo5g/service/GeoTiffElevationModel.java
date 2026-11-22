package com.tfg.gemelo5g.service;

import com.tfg.gemelo5g.exception.TerrainCoverageException;
import com.tfg.gemelo5g.exception.TerrainDataUnavailableException;
import com.tfg.gemelo5g.model.TerrainExtentDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.metadata.IIOMetadata;
import javax.imageio.plugins.tiff.TIFFDirectory;
import javax.imageio.plugins.tiff.TIFFField;
import javax.imageio.plugins.tiff.TIFFImageReadParam;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.Raster;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;

@Component
public class GeoTiffElevationModel implements ElevationProvider {
    private static final int MODEL_PIXEL_SCALE = 33550;
    private static final int MODEL_TIEPOINT = 33922;
    private static final int GEO_KEY_DIRECTORY = 34735;
    private static final int GDAL_NODATA = 42113;
    private static final int RASTER_TYPE_KEY = 1025;
    private static final int RASTER_PIXEL_IS_AREA = 1;
    private static final int RASTER_PIXEL_IS_POINT = 2;

    private final Path rasterPath;
    private volatile RasterData rasterData;

    public GeoTiffElevationModel(
            @Value("${terrain.srtm-path:../matlab/data/srtm_fuenlabrada.tif}") String rasterPath) {
        this.rasterPath = Paths.get(rasterPath).toAbsolutePath().normalize();
    }

    @Override
    public double elevationAt(double latitude, double longitude) {
        return getRasterData().interpolate(latitude, longitude);
    }

    public TerrainExtentDto extent() {
        return getRasterData().extent();
    }

    private RasterData getRasterData() {
        RasterData loaded = rasterData;
        if (loaded != null) {
            return loaded;
        }
        synchronized (this) {
            if (rasterData == null) {
                rasterData = loadRaster();
            }
            return rasterData;
        }
    }

    private RasterData loadRaster() {
        if (!Files.isRegularFile(rasterPath)) {
            throw new TerrainDataUnavailableException(
                    "No se encuentra el raster GeoTIFF configurado: " + rasterPath);
        }

        try (ImageInputStream input = ImageIO.createImageInputStream(rasterPath.toFile())) {
            if (input == null) {
                throw new IOException("No se pudo abrir el GeoTIFF");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new IOException("La instalación de Java no dispone de un lector TIFF");
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(input);
                ImageReadParam readParam = reader.getDefaultReadParam();
                if (!(readParam instanceof TIFFImageReadParam tiffReadParam)) {
                    throw new IOException("El lector TIFF no admite la lectura de tags privados");
                }
                tiffReadParam.setReadUnknownTags(true);
                Raster raster = reader.read(0, readParam).getRaster();
                IIOMetadata metadata = reader.getImageMetadata(0);
                TIFFDirectory directory = TIFFDirectory.createFromMetadata(metadata);
                double[] pixelScale = requiredDoubles(directory, MODEL_PIXEL_SCALE, 2);
                double[] tiepoint = requiredDoubles(directory, MODEL_TIEPOINT, 6);
                boolean pixelIsArea = isPixelArea(directory);
                if (!Double.isFinite(pixelScale[0]) || !Double.isFinite(pixelScale[1])
                        || pixelScale[0] <= 0 || pixelScale[1] <= 0) {
                    throw new IOException("Escala de píxel GeoTIFF no válida");
                }
                double noData = readNoData(directory);
                return new RasterData(
                        raster,
                        tiepoint[3],
                        tiepoint[4],
                        pixelScale[0],
                        pixelScale[1],
                        pixelIsArea,
                        noData,
                        containsNoDataCells(raster, noData));
            } finally {
                reader.dispose();
            }
        } catch (IOException | IllegalArgumentException e) {
            throw new TerrainDataUnavailableException(
                    "No se pudo leer el GeoTIFF configurado " + rasterPath + ": " + e.getMessage(), e);
        }
    }

    private static double[] requiredDoubles(TIFFDirectory directory, int tag, int minimumCount)
            throws IOException {
        TIFFField field = directory.getTIFFField(tag);
        if (field == null || field.getCount() < minimumCount) {
            throw new IOException("Falta el tag GeoTIFF requerido " + tag);
        }
        double[] values = new double[field.getCount()];
        for (int i = 0; i < values.length; i++) {
            values[i] = field.getAsDouble(i);
        }
        return values;
    }

    private static boolean isPixelArea(TIFFDirectory directory) throws IOException {
        TIFFField field = directory.getTIFFField(GEO_KEY_DIRECTORY);
        if (field == null || field.getCount() < 4) {
            throw new IOException("Falta el directorio GeoKey del raster");
        }
        int keyCount = field.getAsInt(3);
        for (int i = 0; i < keyCount; i++) {
            int entry = 4 + i * 4;
            if (entry + 3 >= field.getCount()) {
                throw new IOException("Directorio GeoKey truncado");
            }
            if (field.getAsInt(entry) == RASTER_TYPE_KEY) {
                int location = field.getAsInt(entry + 1);
                int count = field.getAsInt(entry + 2);
                if (location != 0 || count != 1) {
                    throw new IOException("RasterType GeoKey no soportado");
                }
                int rasterType = field.getAsInt(entry + 3);
                if (rasterType == RASTER_PIXEL_IS_AREA) {
                    return true;
                }
                if (rasterType == RASTER_PIXEL_IS_POINT) {
                    return false;
                }
                throw new IOException("RasterType GeoKey desconocido: " + rasterType);
            }
        }
        throw new IOException("No se encontró el RasterType GeoKey");
    }

    private static double readNoData(TIFFDirectory directory) throws IOException {
        TIFFField field = directory.getTIFFField(GDAL_NODATA);
        if (field == null || field.getCount() == 0) {
            return Double.NaN;
        }
        try {
            return Double.parseDouble(field.getAsString(0).trim());
        } catch (NumberFormatException e) {
            throw new IOException("Valor GDAL_NODATA no válido", e);
        }
    }

    private static boolean containsNoDataCells(Raster raster, double noData) {
        for (int y = 0; y < raster.getHeight(); y++) {
            for (int x = 0; x < raster.getWidth(); x++) {
                double value = raster.getSampleDouble(x, y, 0);
                if (!Double.isFinite(value) || (!Double.isNaN(noData) && value == noData)) {
                    return true;
                }
            }
        }
        return false;
    }

    private record RasterData(
            Raster raster,
            double tieLongitude,
            double tieLatitude,
            double longitudeScale,
            double latitudeScale,
            boolean pixelIsArea,
            double noData,
            boolean containsNoDataCells
    ) {
        private TerrainExtentDto extent() {
            RasterBounds bounds = bounds();
            return new TerrainExtentDto(
                    bounds.westLongitude(),
                    bounds.southLatitude(),
                    bounds.eastLongitude(),
                    bounds.northLatitude(),
                    longitudeScale,
                    latitudeScale,
                    Double.isNaN(noData) ? null : noData,
                    containsNoDataCells);
        }

        private double interpolate(double latitude, double longitude) {
            if (!bounds().contains(latitude, longitude)) {
                throw outsideRaster(latitude, longitude);
            }

            double centerOffset = pixelIsArea ? 0.5 : 0.0;
            double x = (longitude - tieLongitude) / longitudeScale - centerOffset;
            double y = (tieLatitude - latitude) / latitudeScale - centerOffset;
            x = Math.max(0, Math.min(raster.getWidth() - 1, x));
            y = Math.max(0, Math.min(raster.getHeight() - 1, y));

            int x0 = (int) Math.floor(x);
            int y0 = (int) Math.floor(y);
            int x1 = Math.min(x0 + 1, raster.getWidth() - 1);
            int y1 = Math.min(y0 + 1, raster.getHeight() - 1);
            double fx = x - x0;
            double fy = y - y0;
            double[] weights = {
                    (1 - fx) * (1 - fy),
                    fx * (1 - fy),
                    (1 - fx) * fy,
                    fx * fy
            };
            double[] samples = {
                    raster.getSampleDouble(x0, y0, 0),
                    raster.getSampleDouble(x1, y0, 0),
                    raster.getSampleDouble(x0, y1, 0),
                    raster.getSampleDouble(x1, y1, 0)
            };

            double weightedElevation = 0;
            double validWeight = 0;
            for (int i = 0; i < samples.length; i++) {
                if (weights[i] > 0 && !isNoData(samples[i])) {
                    weightedElevation += samples[i] * weights[i];
                    validWeight += weights[i];
                }
            }
            if (validWeight == 0) {
                throw noData(latitude, longitude);
            }
            return weightedElevation / validWeight;
        }

        private RasterBounds bounds() {
            double outerEdgeOffset = pixelIsArea ? 1.0 : 0.0;
            return new RasterBounds(
                    tieLongitude,
                    tieLatitude - (raster.getHeight() - 1 + outerEdgeOffset) * latitudeScale,
                    tieLongitude + (raster.getWidth() - 1 + outerEdgeOffset) * longitudeScale,
                    tieLatitude);
        }

        private boolean isNoData(double value) {
            return !Double.isFinite(value) || (!Double.isNaN(noData) && value == noData);
        }

        private TerrainCoverageException outsideRaster(double latitude, double longitude) {
            return new TerrainCoverageException(String.format(
                    "La coordenada (%.6f, %.6f) está fuera de los límites del raster configurado",
                    latitude, longitude));
        }

        private TerrainCoverageException noData(double latitude, double longitude) {
            return new TerrainCoverageException(String.format(
                    "La coordenada (%.6f, %.6f) cae en un área NoData del raster configurado",
                    latitude, longitude));
        }
    }

    private record RasterBounds(
            double westLongitude,
            double southLatitude,
            double eastLongitude,
            double northLatitude
    ) {
        private boolean contains(double latitude, double longitude) {
            return longitude >= westLongitude && longitude <= eastLongitude
                    && latitude >= southLatitude && latitude <= northLatitude;
        }
    }
}
