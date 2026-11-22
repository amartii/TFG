package com.tfg.gemelo5g.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.gemelo5g.model.SimulationRequest;
import com.tfg.gemelo5g.model.TransmitterParameters;
import com.tfg.gemelo5g.service.ElevationProvider;
import com.tfg.gemelo5g.service.PropagationEngine;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SyntheticMatlabComparisonTest {
    @Test
    void flatAndRidgeAgreeWithIndependentMatlabControlWhenProvided() throws Exception {
        double endLatitude = Math.toDegrees(1000.0 / 6_371_000);
        TransmitterParameters tx = new TransmitterParameters(0.0, 0.0, 30.0, 40.0, 15.0);
        SimulationRequest request = new SimulationRequest(
                "Synthetic", 3.5, 30.0, 1.0, 30.0, 2.0, List.of(tx));
        ElevationProvider ridge = (latitude, longitude) ->
                Math.max(0, 60 * (1 - Math.abs(latitude / endLatitude - 0.5) / 0.15));
        double flat = new PropagationEngine((lat, lon) -> 0)
                .calculateRsrp(request, tx, endLatitude, 0);
        double obstructed = new PropagationEngine(ridge)
                .calculateRsrp(request, tx, endLatitude, 0);
        assertEquals(-79.316396, flat, 1e-6);
        assertTrue(obstructed < flat);

        String controlPath = System.getProperty("matlab.synthetic.result");
        if (controlPath != null) {
            JsonNode result = new ObjectMapper().readTree(Path.of(controlPath).toFile());
            assertEquals(1000.0, result.required("distance_m").asDouble(), 1e-8);
            assertEquals(flat, result.required("flat_dbm").asDouble(), 1e-8);
            assertEquals(obstructed, result.required("ridge_dbm").asDouble(), 1e-8);
            System.out.printf("Control Java-MATLAB: plano=%.9f dBm cresta=%.9f dBm diferencia máxima < 1e-8 dB%n",
                    flat, obstructed);
        }
    }
}
