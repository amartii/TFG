package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tfg.gemelo5g.controller.LinkProfileController;
import com.tfg.gemelo5g.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LinkProfileServiceTest {
    private static final String ID = "a3e268bd-8c3e-4d0e-8064-a316758ded81";

    @TempDir Path temp;

    @Test
    void buildsProfileFromSavedScenarioWithSrtmSamples() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode simulation = mapper.createObjectNode();
        simulation.put("id", ID);
        simulation.putObject("metadata").put("frequency_ghz", 3.5);
        ObjectNode parameters = simulation.putObject("parameters");
        parameters.put("espaciado_grid_m", 50);
        parameters.put("altura_rx_m", 1.5);
        parameters.putArray("transmitters").addObject()
                .put("latitude", 40).put("longitude", -4).put("txHeightM", 30);
        mapper.writeValue(temp.resolve(ID + ".json").toFile(), simulation);

        LinkProfileService service = new LinkProfileService(
                new SimulationService(temp.toString(), mapper),
                new PropagationEngine((latitude, longitude) -> 100 + latitude - 40));

        var profile = service.calculate(ID, 40.009, -4);

        assertTrue(profile.distanceM() > 900 && profile.distanceM() < 1_100);
        assertEquals(3.5, profile.frequencyGHz());
        assertTrue(profile.samples().size() > 2);
        assertEquals(130, profile.samples().get(0).lineOfSightHeightM(), 0);

        MockMvc api = MockMvcBuilders.standaloneSetup(new LinkProfileController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        String path = "/api/simulations/" + ID + "/link-profile";
        api.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiverLatitude\":40.009,\"receiverLongitude\":-4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.samples.length()").value(profile.samples().size()))
                .andExpect(jsonPath("$.firstFresnelRadiusMaxM").isNumber());
        api.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"receiverLatitude\":90.1,\"receiverLongitude\":-4}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reportsWhenScenarioCannotSupplyLinkParameters() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode simulation = mapper.createObjectNode();
        simulation.put("id", ID);
        simulation.putObject("metadata");
        simulation.putObject("parameters");
        mapper.writeValue(temp.resolve(ID + ".json").toFile(), simulation);
        LinkProfileService service = new LinkProfileService(
                new SimulationService(temp.toString(), mapper),
                new PropagationEngine((latitude, longitude) -> 0));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class, () -> service.calculate(ID, 40, -4));
        assertTrue(error.getMessage().contains("parámetros suficientes"));
    }

    @Test
    void rejectsAmbiguousHistoricalTransmitterArrayWithoutSelector() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode simulation = mapper.createObjectNode();
        simulation.put("id", ID);
        simulation.putObject("metadata").put("frequency_ghz", 3.5);
        ObjectNode parameters = simulation.putObject("parameters");
        parameters.put("espaciado_grid_m", 50);
        parameters.put("altura_rx_m", 1.5);
        var transmitters = parameters.putArray("transmitters");
        transmitters.addObject().put("latitude", 40).put("longitude", -4).put("txHeightM", 30);
        transmitters.addObject().put("latitude", 40.005).put("longitude", -4).put("txHeightM", 60);
        mapper.writeValue(temp.resolve(ID + ".json").toFile(), simulation);
        LinkProfileService service = new LinkProfileService(new SimulationService(temp.toString(), mapper),
                new PropagationEngine((latitude, longitude) -> 100));
        MockMvc api = MockMvcBuilders.standaloneSetup(new LinkProfileController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        String path = "/api/simulations/" + ID + "/link-profile";
        String body = "{\"receiverLatitude\":40.01,\"receiverLongitude\":-4}";
        api.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }
}
