package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.tfg.gemelo5g.model.LinkProfileDto;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class LinkProfileService {
    private final SimulationService simulations;
    private final PropagationEngine propagationEngine;

    public LinkProfileService(SimulationService simulations, PropagationEngine propagationEngine) {
        this.simulations = simulations;
        this.propagationEngine = propagationEngine;
    }

    public LinkProfileDto calculate(String simulationId, double receiverLatitude, double receiverLongitude)
            throws IOException {
        JsonNode simulation = simulations.getById(simulationId);
        JsonNode parameters = simulation.path("parameters");
        JsonNode transmitters = parameters.path("transmitters");
        if (!transmitters.isMissingNode() && (!transmitters.isArray() || transmitters.isEmpty())) {
            throw new IllegalArgumentException("La lista de transmisores del escenario no es válida.");
        }
        if (transmitters.isArray() && transmitters.size() > 1) {
            throw new IllegalArgumentException("El perfil requiere un escenario mononodo; el histórico se conserva para lectura.");
        }
        JsonNode transmitter = transmitters.path(0);
        double txLatitude = transmitters.isArray() ? transmitter.path("latitude").asDouble(Double.NaN)
                : parameters.path("lat_emplazamiento").asDouble(Double.NaN);
        double txLongitude = transmitters.isArray() ? transmitter.path("longitude").asDouble(Double.NaN)
                : parameters.path("lon_emplazamiento").asDouble(Double.NaN);
        double txHeight = transmitters.isArray() ? transmitter.path("txHeightM").asDouble(Double.NaN)
                : parameters.path("altura_tx_m").asDouble(Double.NaN);
        double rxHeight = parameters.path("altura_rx_m").asDouble(Double.NaN);
        double frequencyGHz = simulation.path("metadata").path("frequency_ghz")
                .asDouble(parameters.path("frecuencia_GHz").asDouble(Double.NaN));
        double spacing = parameters.path("espaciado_grid_m").asDouble(Double.NaN);
        if (!Double.isFinite(txLatitude) || !Double.isFinite(txLongitude)
                || !Double.isFinite(txHeight) || !Double.isFinite(rxHeight)
                || !Double.isFinite(frequencyGHz) || !Double.isFinite(spacing)) {
            throw new IllegalArgumentException("El escenario guardado no contiene parámetros suficientes para calcular un perfil de enlace.");
        }
        return propagationEngine.calculateLinkProfile(txLatitude, txLongitude, txHeight,
                receiverLatitude, receiverLongitude, rxHeight, frequencyGHz, spacing);
    }
}
