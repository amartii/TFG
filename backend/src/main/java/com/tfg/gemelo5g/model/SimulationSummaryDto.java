package com.tfg.gemelo5g.model;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * DTO devuelto en el listado GET /api/simulations.
 * Contiene solo los campos ligeros (sin coveragePoints) para no sobrecargar
 * al cliente cuando hay múltiples simulaciones disponibles.
 */
public record SimulationSummaryDto(
        String id,
        String name,
        String createdAt,
        JsonNode metadata
) {}
