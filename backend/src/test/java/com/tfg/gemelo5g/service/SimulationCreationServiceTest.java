package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.gemelo5g.model.SimulationRequest;
import com.tfg.gemelo5g.model.TransmitterParameters;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;

class SimulationCreationServiceTest {

    private static final String UNSPECIFIED_TERRAIN_SOURCE =
            "Raster local (procedencia no especificada)";

    @TempDir
    Path tempDir;

    @Test
    void persistedCreationUsesGenericSourceWhenNotConfigured() throws Exception {
        Path raster = SyntheticGeoTiffFixture.write(
                tempDir, "terrain-source-default.tif", SyntheticGeoTiffFixture.RASTER_PIXEL_IS_AREA);
        Path dataDir = tempDir.resolve("data");
        Files.createDirectories(dataDir);
        Path historicalJson = dataDir.resolve("00000000-0000-4000-8000-000000000001.json");
        byte[] historicalContent = "{\"id\":\"00000000-0000-4000-8000-000000000001\","
                .concat("\"metadata\":{\"terrain_data\":\"Legacy SRTM\"}}")
                .getBytes(java.nio.charset.StandardCharsets.UTF_8);
        Files.write(historicalJson, historicalContent);

        terrainSourceContext(dataDir, raster, null).run(context -> {
            assertTrue(context.isRunning());
            SimulationCreationService service = context.getBean(SimulationCreationService.class);
            SimulationRequest request = terrainSourceRequest();

            JsonNode created = service.create(request);
            assertTerrainSource(created, UNSPECIFIED_TERRAIN_SOURCE);
            assertEquals(9, created.path("coveragePoints").size());
            JsonNode persisted = new ObjectMapper().readTree(
                    dataDir.resolve(created.path("id").asText() + ".json").toFile());
            assertTerrainSource(persisted, UNSPECIFIED_TERRAIN_SOURCE);
            assertArrayEquals(historicalContent, Files.readAllBytes(historicalJson));
        });
    }

    @Test
    void persistedCreationPreservesExplicitTerrainSource() throws Exception {
        Path raster = SyntheticGeoTiffFixture.write(
                tempDir, "terrain-source-explicit.tif", SyntheticGeoTiffFixture.RASTER_PIXEL_IS_POINT);
        Path dataDir = tempDir.resolve("data");
        String explicitSource = "Terreno sintético de demostración";

        terrainSourceContext(dataDir, raster, explicitSource).run(context -> {
            assertTrue(context.isRunning());
            SimulationCreationService service = context.getBean(SimulationCreationService.class);
            SimulationRequest request = terrainSourceRequest();

            JsonNode created = service.create(request);
            assertTerrainSource(created, explicitSource);
            assertEquals(9, created.path("coveragePoints").size());
            JsonNode persisted = new ObjectMapper().readTree(
                    dataDir.resolve(created.path("id").asText() + ".json").toFile());
            assertTerrainSource(persisted, explicitSource);
        });
    }

    private ApplicationContextRunner terrainSourceContext(Path dataDir, Path raster, String source) {
        var runner = new ApplicationContextRunner()
                .withUserConfiguration(TerrainSourceTestConfiguration.class)
                .withPropertyValues(
                        "simulations.data-dir=" + dataDir,
                        "terrain.srtm-path=" + raster);
        return source == null ? runner : runner.withPropertyValues("terrain.source=" + source);
    }

    private SimulationRequest terrainSourceRequest() {
        return new SimulationRequest(
                "Terrain source", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(new TransmitterParameters(19.75, 10.125, 30.0, 40.0, 15.0)));
    }

    private static void assertTerrainSource(JsonNode result, String expected) {
        assertEquals(expected, result.path("metadata").path("terrain_data").asText());
        assertEquals(expected, result.path("parameters").path("datos_elevacion").asText());
    }

    @Configuration(proxyBeanMethods = false)
    @Import({GeoTiffElevationModel.class, SimulationCreationService.class})
    static class TerrainSourceTestConfiguration {
        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper();
        }

        @Bean
        PropagationEngine propagationEngine(GeoTiffElevationModel terrain) {
            return new PropagationEngine(terrain);
        }
    }

    @Test
    void createsAndPersistsCompatibleSimulationJson() throws Exception {
        SimulationCreationService service = new SimulationCreationService(
                tempDir.toString(),
                new ObjectMapper(),
                new PropagationEngine((latitude, longitude) -> 0),
                "Terreno sintético de demostración");
        SimulationRequest request = new SimulationRequest(
                "Created in Java", 3.5, 1.5, 0.11, 50.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0)));

        JsonNode result = service.create(request);

        UUID.fromString(result.path("id").asText());
        assertEquals("Created in Java", result.path("name").asText());
        assertEquals("FSPL+Deygout", result.path("metadata").path("model").asText());
        assertEquals("Terreno sintético de demostración", result.path("metadata").path("terrain_data").asText());
        assertEquals("Terreno sintético de demostración", result.path("parameters").path("datos_elevacion").asText());
        assertEquals(53, result.path("metadata").path("eirp_dbm").asInt());
        assertTrue(result.path("coveragePoints").isArray());
        assertEquals(16, result.path("coveragePoints").size());
        assertEquals(110.0 / 3,
                result.path("parameters").path("espaciado_grid_m").asDouble(), 1e-9);
        assertEquals(50.0,
                result.path("parameters").path("espaciado_grid_solicitado_m").asDouble());
        assertEquals(1, result.path("parameters").path("transmitters").size());
        assertFalse(result.path("parameters").has("perdida_clutter_manual_dB"));
        assertFalse(result.path("parameters").path("transmitters").get(0).has("antennaAzimuthDeg"));
        assertTrue(Files.isRegularFile(tempDir.resolve(result.path("id").asText() + ".json")));
    }

    @Test
    void recordsExplicitPatternAndManualClutterAssumptions() throws Exception {
        SimulationCreationService service = new SimulationCreationService(
                tempDir.toString(), new ObjectMapper(), new PropagationEngine((latitude, longitude) -> 0),
                "SRTM_30m_local");
        SimulationRequest request = new SimulationRequest(
                "Manual radio options", 3.5, 1.5, 0.11, 50.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0, 45.0, 6.0)), 12.0);

        JsonNode result = service.create(request);

        assertEquals("FSPL+Deygout+DirectionalApprox+ManualClutter",
                result.path("metadata").path("model").asText());
        assertEquals(12.0, result.path("parameters").path("perdida_clutter_manual_dB").asDouble());
        assertEquals(45.0, result.path("parameters").path("transmitters").get(0)
                .path("antennaAzimuthDeg").asDouble());
        assertEquals(6.0, result.path("parameters").path("transmitters").get(0)
                .path("antennaDowntiltDeg").asDouble());
    }

}
