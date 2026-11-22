package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tfg.gemelo5g.controller.CalibrationController;
import com.tfg.gemelo5g.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CalibrationServiceTest {
    private static final String ID = "a3e268bd-8c3e-4d0e-8064-a316758ded81";
    private final ObjectMapper mapper = new ObjectMapper();
    @TempDir Path temp;
    private CalibrationService service;
    private ObjectNode simulation;

    @BeforeEach
    void setUp() throws Exception {
        simulation = mapper.createObjectNode();
        simulation.put("id", ID);
        simulation.putObject("metadata").put("model_version", "test");
        simulation.putObject("parameters").put("espaciado_grid_m", 100);
        ArrayNode points = simulation.putArray("coveragePoints");
        double[] predictions = {-100, -94, -88, -82, -97, -90, -84};
        for (int i = 0; i < predictions.length; i++) {
            ObjectNode point = points.addObject();
            point.put("lat", 40 + i * 0.001); point.put("lng", -3); point.put("rsrp", predictions[i]);
        }
        saveSimulation();
        service = new CalibrationService(new SimulationService(temp.toString(), mapper), mapper, temp.toString());
    }

    @Test
    void calibratesOnlyOnFitAndReopensWithoutChangingPrediction() throws Exception {
        ObjectNode input = input();
        JsonNode result = service.create(ID, input);
        assertEquals(3.0, result.path("offsetDb").asDouble(), 1e-10);
        JsonNode metrics = result.path("holdoutMetrics");
        assertEquals(-3.0, metrics.path("biasBeforeDb").asDouble(), 1e-10);
        assertEquals(0.0, metrics.path("biasAfterDb").asDouble(), 1e-10);
        assertEquals(Math.sqrt(29.0 / 3), metrics.path("rmseBeforeDb").asDouble(), 1e-10);
        assertEquals(Math.sqrt(2.0 / 3), metrics.path("rmseAfterDb").asDouble(), 1e-10);
        ((ObjectNode) input.path("observations").get(4)).put("value", -80);
        assertEquals(3.0, service.create(ID, input).path("offsetDb").asDouble(), 1e-10);
        CalibrationService restarted = new CalibrationService(new SimulationService(temp.toString(), mapper), mapper, temp.toString());
        assertEquals(2, restarted.list(ID).size());
        JsonNode reopened = restarted.list(ID).stream().filter(r -> result.path("id").equals(r.path("id"))).findFirst().orElseThrow();
        assertTrue(reopened.path("predictionMatches").asBoolean());
        assertEquals(-100.0, mapper.readTree(temp.resolve(ID + ".json").toFile()).path("coveragePoints").get(0).path("rsrp").asDouble());
        ((ObjectNode) simulation.path("coveragePoints").get(0)).put("rsrp", -99);
        saveSimulation();
        assertFalse(restarted.list(ID).get(0).path("predictionMatches").asBoolean());
    }

    @Test
    void explainsInvalidIncompatibleOutsideAndLeakyRecords() throws Exception {
        ObjectNode input = input();
        ArrayNode rows = (ArrayNode) input.path("observations");
        ObjectNode incompatible = rows.addObject(); fill(incompatible, 0, "holdout", -98);
        incompatible.put("quantity", "SS-RSRP");
        ObjectNode outside = rows.addObject(); fill(outside, 8, "holdout", -98);
        ObjectNode leaky = rows.addObject(); fill(leaky, 0, "holdout", -98);
        ObjectNode invalid = rows.addObject(); fill(invalid, 1, "fit", -90); invalid.put("unit", "watts");
        JsonNode result = service.create(ID, input);
        assertEquals(7, result.path("accepted").size());
        assertEquals(4, result.path("rejected").size());
        String rejection = result.path("rejected").toString();
        assertTrue(rejection.contains("SS-RSRP"));
        assertTrue(rejection.contains("Fuera del dominio"));
        assertTrue(rejection.contains("comparte"));
        assertTrue(rejection.contains("Unidad"));
    }

    @Test
    void refusesEmptyReserveAndReturnsReasons() {
        ObjectNode input = input();
        ArrayNode rows = (ArrayNode) input.path("observations");
        for (int i = 4; i < 7; i++) ((ObjectNode) rows.get(i)).put("quantity", "SS-RSRP");
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> service.create(ID, input));
        assertTrue(error.getMessage().contains("SS-RSRP"));
        assertFalse(Files.exists(temp.resolve("calibrations")));
    }

    @Test
    void apiPersistsAndReportsBadInput() throws Exception {
        MockMvc api = MockMvcBuilders.standaloneSetup(new CalibrationController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        String path = "/api/simulations/" + ID + "/calibrations";
        api.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsBytes(input())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.offsetDb").value(3.0));
        api.perform(get(path)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].predictionMatches").value(true))
                .andExpect(jsonPath("$[0].originalObservations.length()").value(7));
        api.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{\"observations\":[]}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").exists());
    }

    @Test
    void rejectsOverBudgetBeforeTraversingGrid() throws Exception {
        assertDoesNotThrow(() -> CalibrationService.checkComparisonBudget(10_000, 1_000));
        assertThrows(IllegalArgumentException.class, () -> CalibrationService.checkComparisonBudget(10_001, 1_000));
        assertThrows(IllegalArgumentException.class, () -> CalibrationService.checkComparisonBudget(Integer.MAX_VALUE, Integer.MAX_VALUE));

        ArrayNode grid = mock(ArrayNode.class);
        when(grid.isArray()).thenReturn(true);
        when(grid.isEmpty()).thenReturn(false);
        when(grid.size()).thenReturn(10_001);
        ObjectNode fakeSimulation = mapper.createObjectNode();
        fakeSimulation.putObject("parameters").put("espaciado_grid_m", 100);
        fakeSimulation.set("coveragePoints", grid);
        SimulationService simulations = mock(SimulationService.class);
        when(simulations.getById(ID)).thenReturn(fakeSimulation);
        ObjectNode request = mapper.createObjectNode();
        ArrayNode observations = request.putArray("observations");
        for (int i = 0; i < 1_000; i++) observations.addObject();

        CalibrationService subject = new CalibrationService(simulations, mapper, temp.toString());
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> subject.create(ID, request));
        assertTrue(error.getMessage().contains("10 millones"));
        verify(grid, never()).iterator();
        assertFalse(Files.exists(temp.resolve("calibrations")));
    }

    @Test
    void corruptResultInAnotherScenarioDoesNotHideHealthyHistory() throws Exception {
        String otherId = "a7ab9bad-3251-424e-915b-8ff3c532de9a";
        ObjectNode otherSimulation = simulation.deepCopy();
        otherSimulation.put("id", otherId);
        mapper.writeValue(temp.resolve(otherId + ".json").toFile(), otherSimulation);
        JsonNode healthy = service.create(ID, input());
        JsonNode otherHealthy = service.create(otherId, input());
        JsonNode otherCorrupt = service.create(otherId, input());
        Path corruptFile = temp.resolve("calibrations").resolve(otherId).resolve(otherCorrupt.path("id").asText() + ".json");
        Files.writeString(corruptFile, "{");

        assertEquals(healthy.path("id"), service.list(ID).get(0).path("id"));
        IOException error = assertThrows(IOException.class, () -> service.list(otherId));
        assertTrue(error.getMessage().contains("Resultado de calibración ilegible"));
        assertTrue(error.getMessage().contains(otherCorrupt.path("id").asText()));
        Path preserved = temp.resolve("calibrations").resolve(otherId).resolve(otherHealthy.path("id").asText() + ".json");
        assertEquals(otherHealthy.path("id"), mapper.readTree(preserved.toFile()).path("id"));
    }

    @Test
    void legacyResultsRemainReadableEvenWithAnUnattributableCorruptFile() throws Exception {
        JsonNode result = service.create(ID, input());
        Path directory = temp.resolve("calibrations");
        Files.move(directory.resolve(ID).resolve(result.path("id").asText() + ".json"), directory.resolve("legacy.json"));
        Files.writeString(directory.resolve("corrupt.json"), "{");
        assertEquals(result.path("id"), service.list(ID).get(0).path("id"));
    }

    private void saveSimulation() throws Exception {
        mapper.writeValue(temp.resolve(ID + ".json").toFile(), simulation);
    }
    private ObjectNode input() {
        ObjectNode input = mapper.createObjectNode();
        ArrayNode rows = input.putArray("observations");
        double[] observed = {-98, -90, -84, -80, -95, -87, -80};
        for (int i = 0; i < observed.length; i++) fill(rows.addObject(), i, i < 4 ? "fit" : "holdout", observed[i]);
        return input;
    }
    private void fill(ObjectNode row, int i, String split, double value) {
        row.put("latitude", 40 + i * 0.001); row.put("longitude", -3);
        row.put("value", value); row.put("unit", "dBm"); row.put("quantity", "prototype_power_proxy");
        row.put("timestamp", "2026-01-01T00:00:00Z"); row.put("provenance", "synthetic");
        row.put("source", "test sintético"); row.put("split", split);
    }
}
