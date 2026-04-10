package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.gemelo5g.exception.SimulationNotFoundException;
import com.tfg.gemelo5g.model.SimulationSummaryDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Stream;

/**
 * Lee los ficheros JSON generados por MATLAB del directorio configurado en
 * {@code simulations.data-dir} (application.properties).
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
    public JsonNode getById(String id) throws IOException {
        Path file = dataDir.resolve(id + ".json");
        if (!Files.exists(file)) {
            throw new SimulationNotFoundException(id);
        }
        return mapper.readTree(file.toFile());
    }

    // -----------------------------------------------------------------------

    private SimulationSummaryDto parseSummary(Path file) {
        try {
            JsonNode root = mapper.readTree(file.toFile());
            return new SimulationSummaryDto(
                    root.path("id").asText(),
                    root.path("name").asText(),
                    root.path("createdAt").asText(),
                    root.path("metadata")
            );
        } catch (IOException e) {
            // Si un fichero está corrupto, devolver un DTO con id = nombre del fichero
            String name = file.getFileName().toString().replace(".json", "");
            return new SimulationSummaryDto(name, "ERROR: " + e.getMessage(), null, null);
        }
    }
}
