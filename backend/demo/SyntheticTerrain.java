import java.awt.image.BufferedImage;
import java.nio.file.Path;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.ImageWriter;
import javax.imageio.plugins.tiff.GeoTIFFTagSet;
import javax.imageio.plugins.tiff.TIFFDirectory;
import javax.imageio.plugins.tiff.TIFFField;
import javax.imageio.plugins.tiff.TIFFTag;
import javax.imageio.stream.ImageOutputStream;

public class SyntheticTerrain {
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("Expected output TIFF path");
        }
        BufferedImage image = new BufferedImage(101, 101, BufferedImage.TYPE_USHORT_GRAY);
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                image.getRaster().setSample(x, y, 0, 100 + (x + y) / 4);
            }
        }

        ImageWriter writer = ImageIO.getImageWritersByFormatName("TIFF").next();
        try (ImageOutputStream output = ImageIO.createImageOutputStream(Path.of(args[0]).toFile())) {
            if (output == null) {
                throw new IllegalStateException("Cannot create output TIFF");
            }
            writer.setOutput(output);
            var param = writer.getDefaultWriteParam();
            var type = ImageTypeSpecifier.createFromRenderedImage(image);
            TIFFDirectory directory = TIFFDirectory.createFromMetadata(writer.getDefaultImageMetadata(type, param));
            GeoTIFFTagSet tags = GeoTIFFTagSet.getInstance();
            directory.addTagSet(tags);
            directory.addTIFFField(new TIFFField(tags.getTag(GeoTIFFTagSet.TAG_MODEL_PIXEL_SCALE),
                    TIFFTag.TIFF_DOUBLE, 3, new double[]{0.001, 0.001, 0.0}));
            directory.addTIFFField(new TIFFField(tags.getTag(GeoTIFFTagSet.TAG_MODEL_TIE_POINT),
                    TIFFTag.TIFF_DOUBLE, 6, new double[]{0, 0, 0, -3.8744, 40.3397, 0}));
            char[] keys = {1, 1, 0, 1, 1025, 0, 1, 2};
            directory.addTIFFField(new TIFFField(tags.getTag(GeoTIFFTagSet.TAG_GEO_KEY_DIRECTORY),
                    TIFFTag.TIFF_SHORT, keys.length, keys));
            writer.write(null, new IIOImage(image, null, directory.getAsMetadata()), param);
        } finally {
            writer.dispose();
        }
    }
}
