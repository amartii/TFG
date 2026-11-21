package com.tfg.gemelo5g.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.tfg.gemelo5g.model.SimulationSummaryDto;
import com.tfg.gemelo5g.service.SimulationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/simulations")
@Validated
@Tag(name = "Simulations", description = "Acceso a las simulaciones de cobertura 5G generadas por MATLAB")
public class SimulationController {

    private final SimulationService service;

    public SimulationController(SimulationService service) {
        this.service = service;
    }

    /**
     * GET /api/simulations
     * Lista todas las simulaciones disponibles (sin coveragePoints).
     * Soporta paginación opcional con ?page=0&size=10
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar simulaciones",
               description = "Devuelve el resumen de todas las simulaciones. Soporta paginación con ?page=0&size=10.")
    public ResponseEntity<?> listSimulations(
            @RequestParam(required = false)
            @Min(value = 0, message = "page debe ser >= 0") Integer page,
            @RequestParam(required = false, defaultValue = "10")
            @Min(value = 1, message = "size debe ser >= 1")
            @Max(value = 100, message = "size debe ser <= 100") int size) throws IOException {

        List<SimulationSummaryDto> all = service.listAll();

        if (page == null) {
            return ResponseEntity.ok(all);
        }

        int totalElements = all.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);

        List<SimulationSummaryDto> content = all.subList(fromIndex, toIndex);

        return ResponseEntity.ok(new PageResponse<>(content, totalElements, page, size, totalPages));
    }

    /**
     * GET /api/simulations/{id}
     * Devuelve el JSON completo de una simulación (incluye coveragePoints).
     */
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener simulación por ID",
               description = "Devuelve el JSON completo de la simulación, incluyendo todos los coveragePoints para el heatmap.")
    public JsonNode getSimulation(
            @Parameter(description = "UUID de la simulación (sin extensión .json)")
            @PathVariable String id) throws IOException {
        return service.getById(id);
    }

    /**
     * GET /api/simulations/{id}/export
     * Descarga el JSON completo de la simulación como fichero adjunto.
     */
    @GetMapping(value = "/{id}/export", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Exportar simulación como fichero",
               description = "Descarga el JSON completo de la simulación con Content-Disposition: attachment.")
    public ResponseEntity<Resource> exportSimulation(
            @Parameter(description = "UUID de la simulación (sin extensión .json)")
            @PathVariable String id) throws IOException {
        Resource resource = service.getFileResource(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".json\"")
                .body(resource);
    }

    // DTO interno para respuesta paginada
    public record PageResponse<T>(
            List<T> content,
            int totalElements,
            int page,
            int size,
            int totalPages
    ) {}
}
