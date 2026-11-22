package com.tfg.gemelo5g.service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.ImageWriter;
import javax.imageio.plugins.tiff.GeoTIFFTagSet;
import javax.imageio.plugins.tiff.TIFFDirectory;
import javax.imageio.plugins.tiff.TIFFField;
import javax.imageio.plugins.tiff.TIFFTag;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Iterator;

final class SyntheticGeoTiffFixture {
    static final int RASTER_PIXEL_IS_AREA = 1;
    static final int RASTER_PIXEL_IS_POINT = 2;

    private SyntheticGeoTiffFixture() {}

    static Path write(Path directory, String filename, int rasterType) throws IOException {
        BufferedImage image = new BufferedImage(2, 3, BufferedImage.TYPE_BYTE_GRAY);
        int value = 10;
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                image.getRaster().setSample(x, y, 0, value);
                value += 10;
            }
        }

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("TIFF");
        if (!writers.hasNext()) {
            throw new IOException("No TIFF writer available");
        }
        ImageWriter writer = writers.next();
        Path path = directory.resolve(filename);
        try (ImageOutputStream output = ImageIO.createImageOutputStream(path.toFile())) {
            writer.setOutput(output);
            var writeParam = writer.getDefaultWriteParam();
            var imageType = ImageTypeSpecifier.createFromRenderedImage(image);
            TIFFDirectory metadata = TIFFDirectory.createFromMetadata(
                    writer.getDefaultImageMetadata(imageType, writeParam));
            GeoTIFFTagSet tagSet = GeoTIFFTagSet.getInstance();
            metadata.addTagSet(tagSet);
            metadata.addTIFFField(new TIFFField(
                    tagSet.getTag(GeoTIFFTagSet.TAG_MODEL_PIXEL_SCALE),
                    TIFFTag.TIFF_DOUBLE,
                    3,
                    new double[]{0.25, 0.5, 0.0}));
            metadata.addTIFFField(new TIFFField(
                    tagSet.getTag(GeoTIFFTagSet.TAG_MODEL_TIE_POINT),
                    TIFFTag.TIFF_DOUBLE,
                    6,
                    new double[]{0.0, 0.0, 0.0, 10.0, 20.0, 0.0}));
            char[] geoKeys = {1, 1, 0, 1, 1025, 0, 1, (char) rasterType};
            metadata.addTIFFField(new TIFFField(
                    tagSet.getTag(GeoTIFFTagSet.TAG_GEO_KEY_DIRECTORY),
                    TIFFTag.TIFF_SHORT,
                    geoKeys.length,
                    geoKeys));
            writer.write(null, new IIOImage(image, null, metadata.getAsMetadata()), writeParam);
        } finally {
            writer.dispose();
        }
        return path;
    }
}
