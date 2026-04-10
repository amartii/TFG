package com.tfg.gemelo5g.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.tfg.gemelo5g.model.SimulationSummaryDto;
import com.tfg.gemelo5g.service.SimulationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/simulations")
@Tag(name = "Simulations", description = "Acceso a las simulaciones de cobertura 5G generadas por MATLAB")
public class SimulationController {

    private final SimulationService service;

    public SimulationController(SimulationService service) {
        this.service = service;
    }

    /**
     * GET /api/simulations
     * Lista todas las simulaciones disponibles (sin coveragePoints).
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar simulaciones",
               description = "Devuelve el resumen de todas las simulaciones disponibles en el directorio de datos.")
    public List<SimulationSummaryDto> listSimulations() throws IOException {
        return service.listAll();
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
}
