package com.tfg.gemelo5g.controller;

import java.util.List;

import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.gemelo5g.config.CorsConfig;
import com.tfg.gemelo5g.exception.TerrainCoverageException;
import com.tfg.gemelo5g.exception.TerrainDataUnavailableException;
import com.tfg.gemelo5g.exception.InvalidSimulationIdException;
import com.tfg.gemelo5g.exception.SimulationIdentityMismatchException;
import com.tfg.gemelo5g.exception.SimulationDeletionException;
import com.tfg.gemelo5g.exception.SimulationNotFoundException;
import com.tfg.gemelo5g.model.TerrainExtentDto;
import com.tfg.gemelo5g.model.SimulationSummaryDto;
import com.tfg.gemelo5g.service.GeoTiffElevationModel;
import com.tfg.gemelo5g.service.SimulationCreationService;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tfg.gemelo5g.service.SimulationService;

@WebMvcTest(controllers = {SimulationController.class, TerrainController.class})
@Import(CorsConfig.class)
class SimulationControllerTest {
    private static final String VALID_REQUEST = """
            {
              "name": "Test",
              "frequencyGHz": 3.5,
              "rxHeightM": 1.5,
              "areaKm": 0.1,
              "gridSpacingM": 50,
              "cableLossDb": 2,
              "transmitters": [{
                "latitude": 40.3,
                "longitude": -3.8,
                "txHeightM": 30,
                "txPowerDbm": 40,
                "txGainDbi": 15
              }]
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SimulationService simulationService;

    @MockBean
    private SimulationCreationService creationService;

    @MockBean
    private GeoTiffElevationModel terrain;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void listSimulations_withInvalidPagination_returnsBadRequest() throws Exception {
        when(simulationService.listAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/simulations")
                        .param("page", "-1")
                        .param("size", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listSimulations_invalidFileHasExplicitErrorContract() throws Exception {
        when(simulationService.listAll()).thenReturn(List.of(
                new SimulationSummaryDto("550e8400-e29b-41d4-a716-446655440003",
                        null, null, null, false, "El JSON no se puede leer.")));

        mockMvc.perform(get("/api/simulations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].valid").value(false))
                .andExpect(jsonPath("$[0].error").value("El JSON no se puede leer."))
                .andExpect(jsonPath("$[0].metadata").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void createSimulation_validRequest_returnsMatlabCompatibleJson() throws Exception {
        when(creationService.create(org.mockito.ArgumentMatchers.any()))
                .thenReturn(mapper.readTree("""
                        {"id":"550e8400-e29b-41d4-a716-446655440000","metadata":{},"parameters":{},"coveragePoints":[]}
                        """));

        mockMvc.perform(post("/api/simulations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("550e8400-e29b-41d4-a716-446655440000"))
                .andExpect(jsonPath("$.coveragePoints").isArray());
    }

    @Test
    void previewEndpointIsNotAvailable() throws Exception {
        mockMvc.perform(post("/api/simulations/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isMethodNotAllowed());
        verifyNoInteractions(creationService);
    }

    @Test
    void createSimulation_invalidCoordinates_returnsBadRequestWithoutCallingEngine() throws Exception {
        String invalidRequest = VALID_REQUEST.replace("\"latitude\": 40.3", "\"latitude\": 91");

        mockMvc.perform(post("/api/simulations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());

        verifyNoInteractions(creationService);
    }

    @Test
    void createSimulation_nullTransmitter_returnsBadRequestWithoutCallingEngine() throws Exception {
        String invalidRequest = """
                {
                  "name": "Null transmitter",
                  "frequencyGHz": 3.5,
                  "rxHeightM": 1.5,
                  "areaKm": 0.1,
                  "gridSpacingM": 50,
                  "cableLossDb": 2,
                  "transmitters": [null]
                }
                """;

        mockMvc.perform(post("/api/simulations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());

        verifyNoInteractions(creationService);
    }

    @Test
    void createSimulation_outsideRaster_returnsUnprocessableEntityWithDetail() throws Exception {
        when(creationService.create(org.mockito.ArgumentMatchers.any()))
                .thenThrow(new TerrainCoverageException("La coordenada está fuera del raster configurado"));

        mockMvc.perform(post("/api/simulations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value("La coordenada está fuera del raster configurado"));
    }

    @Test
    void postPreflight_fromAngularOriginAllowsPost() throws Exception {
        mockMvc.perform(options("/api/simulations")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("POST")));
    }

    @Test
    void terrainExtent_returnsBoundsAndNoDataMetadata() throws Exception {
        when(terrain.extent()).thenReturn(
                new TerrainExtentDto(-4, 40, -3, 41, 0.00028, 0.00028, -32767.0, true));

        mockMvc.perform(get("/api/terrain/extent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.westLongitude").value(-4))
                .andExpect(jsonPath("$.northLatitude").value(41))
                .andExpect(jsonPath("$.containsNoDataCells").value(true))
                .andExpect(jsonPath("$.noDataValue").value(-32767));
    }

    @Test
    void terrainExtent_unavailableRasterReturnsServiceUnavailable() throws Exception {
        when(terrain.extent()).thenThrow(
                new TerrainDataUnavailableException("No se pudo leer el GeoTIFF configurado"));

        mockMvc.perform(get("/api/terrain/extent"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Datos de terreno no disponibles"))
                .andExpect(jsonPath("$.detail").value("No se pudo leer el GeoTIFF configurado"));
    }

    @Test
    void createSimulation_multipleTransmitters_returnsBadRequestWithoutCallingEngine() throws Exception {
        String invalidRequest = """
                {
                  "name": "Multiple transmitters",
                  "frequencyGHz": 3.5,
                  "rxHeightM": 1.5,
                  "areaKm": 0.1,
                  "gridSpacingM": 50,
                  "cableLossDb": 2,
                  "transmitters": [
                    {"latitude": 40.3, "longitude": -3.8, "txHeightM": 30, "txPowerDbm": 40, "txGainDbi": 15},
                    {"latitude": 40.4, "longitude": -3.9, "txHeightM": 30, "txPowerDbm": 40, "txGainDbi": 15}
                  ]
                }
                """;

        mockMvc.perform(post("/api/simulations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
        verifyNoInteractions(creationService);
    }

    @Test
    void deleteSimulation_validUuid_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/simulations/550e8400-e29b-41d4-a716-446655440000"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteSimulation_invalidUuid_returnsBadRequest() throws Exception {
        doThrow(new InvalidSimulationIdException("invalid"))
                .when(simulationService).deleteById("invalid");

        mockMvc.perform(delete("/api/simulations/invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(
                        "El identificador de simulación no es un UUID válido: invalid"));
    }

    @Test
    void deleteSimulation_missingFile_returnsNotFound() throws Exception {
        String id = "550e8400-e29b-41d4-a716-446655440000";
        doThrow(new SimulationNotFoundException(id)).when(simulationService).deleteById(id);

        mockMvc.perform(delete("/api/simulations/" + id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Simulación no encontrada"));
    }

    @Test
    void deleteSimulation_mismatchedFileIdentity_returnsConflict() throws Exception {
        String fileId = "550e8400-e29b-41d4-a716-446655440001";
        String declaredId = "550e8400-e29b-41d4-a716-446655440002";
        doThrow(new SimulationIdentityMismatchException(fileId, declaredId))
                .when(simulationService).deleteById(fileId);

        mockMvc.perform(delete("/api/simulations/" + fileId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Identidad de simulación inconsistente"));
    }

    @Test
    void deleteSimulation_ioFailure_returnsExplicitServerError() throws Exception {
        String id = "550e8400-e29b-41d4-a716-446655440000";
        doThrow(new SimulationDeletionException(id, new java.io.IOException("denied")))
                .when(simulationService).deleteById(id);

        mockMvc.perform(delete("/api/simulations/" + id))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("No se pudo eliminar la simulación"))
                .andExpect(jsonPath("$.detail").value(
                        "No se pudo eliminar el archivo de la simulación " + id + ".json"));
    }

    @Test
    void deletePreflight_fromAngularOriginAllowsDelete() throws Exception {
        mockMvc.perform(options("/api/simulations/550e8400-e29b-41d4-a716-446655440000")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "DELETE"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("DELETE")));
    }

    @Test
    void corsRejectsOtherOriginsAndMethods() throws Exception {
        mockMvc.perform(options("/api/simulations")
                        .header("Origin", "http://localhost:4201")
                        .header("Access-Control-Request-Method", "PUT"))
                .andExpect(status().isForbidden());
    }
}
