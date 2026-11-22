package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.gemelo5g.exception.InvalidSimulationIdException;
import com.tfg.gemelo5g.exception.SimulationDeletionException;
import com.tfg.gemelo5g.exception.SimulationIdentityMismatchException;
import com.tfg.gemelo5g.exception.SimulationNotFoundException;
import com.tfg.gemelo5g.model.SimulationSummaryDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

/**
 * Lee resultados históricos compatibles y simulaciones Java del directorio
 * configurado en {@code simulations.data-dir} (application.properties).
 *
 * Cada fichero corresponde a una simulación: <uuid>.json
 */
@Service
public class SimulationService {

    private final Path dataDir;
    private final ObjectMapper mapper;

    public SimulationService(
            @Value("${simulations.data-dir}") String dataDirPath,
            ObjectMapper mapper) {
        this.dataDir = Paths.get(dataDirPath).toAbsolutePath().normalize();
        this.mapper  = mapper;
    }

    /**
     * Lista todas las simulaciones disponibles (sin coveragePoints).
     */
    public List<SimulationSummaryDto> listAll() throws IOException {
        if (!Files.isDirectory(dataDir)) {
            return List.of();
        }
        try (Stream<Path> files = Files.list(dataDir)) {
            return files
                    .filter(p -> p.toString().endsWith(".json"))
                    .map(this::parseSummary)
                    .toList();
        }
    }

    /**
     * Devuelve el JSON completo (con coveragePoints) de una simulación por id.
     *
     * @param id UUID de la simulación (sin extensión .json)
     * @throws SimulationNotFoundException si no existe el fichero
     */
    private static final String UUID_REGEX =
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

    public JsonNode getById(String id) throws IOException {
        if (!id.matches(UUID_REGEX)) {
            throw new SimulationNotFoundException(id);
        }
        Path file = dataDir.resolve(id + ".json").normalize();
        if (!file.startsWith(dataDir) || !Files.exists(file)) {
            throw new SimulationNotFoundException(id);
        }
        return readAndValidateIdentity(file, id);
    }

    /**
     * Devuelve el fichero JSON como Resource para descarga directa.
     */
    public Resource getFileResource(String id) throws IOException {
        if (!id.matches(UUID_REGEX)) {
            throw new SimulationNotFoundException(id);
        }
        Path file = dataDir.resolve(id + ".json").normalize();
        if (!file.startsWith(dataDir) || !Files.exists(file)) {
            throw new SimulationNotFoundException(id);
        }
        readAndValidateIdentity(file, id);
        return new FileSystemResource(file);
    }

    public void deleteById(String id) {
        if (id == null || !id.matches(UUID_REGEX)) {
            throw new InvalidSimulationIdException(id);
        }
        String normalizedId = id.toLowerCase(Locale.ROOT);
        Path file = dataDir.resolve(normalizedId + ".json").normalize();
        if (!file.startsWith(dataDir) || !Files.isRegularFile(file)) {
            throw new SimulationNotFoundException(id);
        }
        try {
            readAndValidateIdentity(file, normalizedId);
            if (!Files.deleteIfExists(file)) {
                throw new SimulationNotFoundException(id);
            }
        } catch (IOException e) {
            throw new SimulationDeletionException(normalizedId, e);
        }
    }

    private JsonNode readAndValidateIdentity(Path file, String expectedId) throws IOException {
        JsonNode root = mapper.readTree(file.toFile());
        if (root == null || !root.isObject()) {
            throw new IOException("El archivo no contiene un objeto JSON válido.");
        }
        String actualId = root.path("id").asText();
        if (!expectedId.equalsIgnoreCase(actualId)) {
            throw new SimulationIdentityMismatchException(expectedId, actualId);
        }
        return root;
    }

    // -----------------------------------------------------------------------

    private SimulationSummaryDto parseSummary(Path file) {
        try {
            JsonNode root = readAndValidateIdentity(file, fileId(file));
            JsonNode metadata = root.get("metadata");
            if (!root.path("name").isTextual() || !hasRequiredSummaryMetadata(metadata)) {
                return invalidSummary(file, "Faltan campos obligatorios de nombre o metadata.");
            }
            return new SimulationSummaryDto(
                    fileId(file),
                    root.path("name").asText(),
                    root.path("createdAt").asText(),
                    metadata,
                    true,
                    null
            );
        } catch (IOException | SimulationIdentityMismatchException e) {
            return invalidSummary(file, e.getMessage());
        }
    }

    private boolean hasRequiredSummaryMetadata(JsonNode metadata) {
        return metadata != null && metadata.isObject()
                && metadata.path("frequency_ghz").isNumber()
                && metadata.path("tx_power_dbm").isNumber()
                && metadata.path("antenna_height_m").isNumber()
                && metadata.path("tx_location").path("latitude").isNumber()
                && metadata.path("tx_location").path("longitude").isNumber()
                && metadata.path("model").isTextual();
    }

    private SimulationSummaryDto invalidSummary(Path file, String error) {
        return new SimulationSummaryDto(fileId(file), null, null, null, false, error);
    }

    private String fileId(Path file) {
        String filename = file.getFileName().toString();
        return filename.substring(0, filename.length() - ".json".length());
    }
}
