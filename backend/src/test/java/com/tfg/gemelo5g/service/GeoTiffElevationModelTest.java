package com.tfg.gemelo5g.service;

import com.tfg.gemelo5g.exception.TerrainCoverageException;
import com.tfg.gemelo5g.exception.TerrainDataUnavailableException;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GeoTiffElevationModelTest {
    private static final int RASTER_PIXEL_IS_AREA = SyntheticGeoTiffFixture.RASTER_PIXEL_IS_AREA;
    private static final int RASTER_PIXEL_IS_POINT = SyntheticGeoTiffFixture.RASTER_PIXEL_IS_POINT;

    @TempDir
    Path tempDir;

    @Test
    void pixelIsAreaUsesOuterPixelCornersForExtentAndSamplingBounds() throws Exception {
        Path raster = writeSyntheticGeoTiff("pixel-is-area.tif", RASTER_PIXEL_IS_AREA);
        GeoTiffElevationModel model = new GeoTiffElevationModel(raster.toString());

        var extent = model.extent();

        assertEquals(10.0, extent.westLongitude(), 1e-9);
        assertEquals(10.5, extent.eastLongitude(), 1e-9);
        assertEquals(18.5, extent.southLatitude(), 1e-9);
        assertEquals(20.0, extent.northLatitude(), 1e-9);
        assertEquals(10.0, model.elevationAt(19.75, 10.125), 1e-9);
        assertEquals(60.0, model.elevationAt(18.75, 10.375), 1e-9);
        assertEquals(60.0, model.elevationAt(18.5, 10.5), 1e-9);
        assertThrows(TerrainCoverageException.class,
                () -> model.elevationAt(20.0001, 9.9999));
    }

    @Test
    void pixelIsPointKeepsTiepointAtTheFirstSampleCenter() throws Exception {
        Path raster = writeSyntheticGeoTiff("pixel-is-point.tif", RASTER_PIXEL_IS_POINT);
        GeoTiffElevationModel model = new GeoTiffElevationModel(raster.toString());

        var extent = model.extent();

        assertEquals(10.0, extent.westLongitude(), 1e-9);
        assertEquals(10.25, extent.eastLongitude(), 1e-9);
        assertEquals(19.0, extent.southLatitude(), 1e-9);
        assertEquals(20.0, extent.northLatitude(), 1e-9);
        assertEquals(10.0, model.elevationAt(20.0, 10.0), 1e-9);
        assertEquals(60.0, model.elevationAt(19.0, 10.25), 1e-9);
        assertThrows(TerrainCoverageException.class,
                () -> model.elevationAt(20.0001, 9.9999));
    }

    @Test
    void localSrtmGeoTiffIsReadableAndRejectsCoordinatesOutsideItsTile() {
        Path raster = Path.of("../matlab/data/srtm_fuenlabrada.tif").toAbsolutePath().normalize();
        Assumptions.assumeTrue(Files.isRegularFile(raster), "Local SRTM tile is not checked in");
        GeoTiffElevationModel model = new GeoTiffElevationModel(raster.toString());

        double elevation = model.elevationAt(40.2897, -3.8244);

        assertTrue(elevation > 0 && elevation < 3_000);
        var extent = model.extent();
        assertTrue(extent.westLongitude() < -3.0 && extent.westLongitude() > -5.0);
        assertTrue(extent.eastLongitude() > -4.0 && extent.eastLongitude() < -2.0);
        assertTrue(extent.southLatitude() < 40.5 && extent.southLatitude() > 39.0);
        assertTrue(extent.northLatitude() > 40.5 && extent.northLatitude() < 42.0);
        assertTrue(extent.longitudePixelSizeDeg() > 0);
        assertTrue(extent.latitudePixelSizeDeg() > 0);
        assertEquals(-32767.0, extent.noDataValue());
        assertFalse(extent.containsNoDataCells());
        TerrainCoverageException exception = assertThrows(TerrainCoverageException.class,
                () -> model.elevationAt(40.5, -4.1));
        assertTrue(exception.getMessage().contains("fuera de los límites del raster configurado"));
    }

    @Test
    void missingRasterFailsExplicitly() {
        GeoTiffElevationModel model = new GeoTiffElevationModel(
                tempDir.resolve("missing.tif").toString());

        assertThrows(TerrainDataUnavailableException.class,
                () -> model.elevationAt(40, -4));
    }

    @Test
    void unreadableRasterFailsExplicitly() throws Exception {
        Path raster = tempDir.resolve("invalid.tif");
        Files.writeString(raster, "not a GeoTIFF");
        GeoTiffElevationModel model = new GeoTiffElevationModel(raster.toString());

        assertThrows(TerrainDataUnavailableException.class, model::extent);
    }

    private Path writeSyntheticGeoTiff(String filename, int rasterType) throws IOException {
        return SyntheticGeoTiffFixture.write(tempDir, filename, rasterType);
    }
}
