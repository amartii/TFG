package com.tfg.gemelo5g.service;

import com.tfg.gemelo5g.controller.RecommendationController;
import com.tfg.gemelo5g.exception.GlobalExceptionHandler;
import com.tfg.gemelo5g.exception.TerrainCoverageException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RecommendationServiceTest {
    private RecommendationService.Request request(double nodes) {
        return new RecommendationService.Request(40.0, -3.0, 1.0, 2.0, 2.0, nodes,
                -100.0, 3.5, 30.0, 1.5, 40.0, 15.0, 2.0);
    }

    @Test
    void greedyCountsMarginalCoverageAndBreaksTiesDeterministically() {
        PropagationEngine engine = mock(PropagationEngine.class);
        when(engine.calculateRsrp(any(), any(), anyDouble(), anyDouble()))
                .thenAnswer(call -> {
                    var tx = (com.tfg.gemelo5g.model.TransmitterParameters) call.getArgument(1);
                    double lat = call.getArgument(2);
                    // Each southern candidate covers southern targets; each northern candidate covers northern.
                    return (tx.latitude() < 40) == (lat < 40) ? -90.0 : -120.0;
                });
        RecommendationService service = new RecommendationService(engine);
        var result = service.recommend(request(3));
        assertEquals(16, result.linkCount());
        assertEquals(4, result.coveredTargets());
        assertEquals(2, result.sites().size());
        assertEquals(2, result.sites().get(0).newlyCovered());
        assertEquals(2, result.sites().get(1).newlyCovered());
        assertEquals(4, result.sites().get(1).cumulativeCovered());
        assertTrue(result.sites().get(0).latitude() < 40);
        assertTrue(result.sites().get(1).latitude() > 40);
        assertEquals(result.sites().get(0).longitude(), result.sites().get(1).longitude());
        assertEquals(result, service.recommend(request(3)));
        verify(engine, times(32)).calculateRsrp(any(), any(), anyDouble(), anyDouble());
    }

    @Test
    void validatesLimitsAndFractionalCountsBeforeCallingEngine() {
        PropagationEngine engine = mock(PropagationEngine.class);
        RecommendationService service = new RecommendationService(engine);
        assertThrows(IllegalArgumentException.class, () -> service.recommend(request(1.5)));
        var tooLarge = new RecommendationService.Request(40.0, -3.0, 6.0, 8.0, 15.0, 2.0,
                -100.0, 3.5, 30.0, 1.5, 40.0, 15.0, 2.0);
        assertThrows(IllegalArgumentException.class, () -> service.recommend(tooLarge));
        var crossing = new RecommendationService.Request(40.0, 179.999, 1.0, 2.0, 2.0, 2.0,
                -100.0, 3.5, 30.0, 1.5, 40.0, 15.0, 2.0);
        assertThrows(IllegalArgumentException.class, () -> service.recommend(crossing));
        verifyNoInteractions(engine);
    }

    @Test
    void syntheticTerrainAndUnavailableTerrainAreExplicit() {
        var service = new RecommendationService(new PropagationEngine((lat, lon) -> 0));
        var result = service.recommend(request(2));
        assertTrue(result.coveredTargets() > 0);
        assertTrue(result.coveredTargets() <= result.targetCount());
        assertEquals(result, service.recommend(request(2)));
        var failing = new RecommendationService(new PropagationEngine((lat, lon) -> {
            throw new TerrainCoverageException("sin terreno");
        }));
        assertThrows(TerrainCoverageException.class, () -> failing.recommend(request(2)));
    }

    @Test
    void noCoverageReturnsNoUnhelpfulSites() {
        PropagationEngine engine = mock(PropagationEngine.class);
        when(engine.calculateRsrp(any(), any(), anyDouble(), anyDouble())).thenReturn(-120.0);
        var result = new RecommendationService(engine).recommend(request(2));
        assertEquals(0, result.coveredTargets());
        assertTrue(result.sites().isEmpty());
    }

    private RecommendationService.Request polygonRequest(List<RecommendationService.Vertex> polygon,
                                                           double candidateSide, double targetSide) {
        return new RecommendationService.Request(null, null, null, candidateSide, targetSide, 2.0,
                -100.0, 3.5, 30.0, 1.5, 40.0, 15.0, 2.0, polygon);
    }

    private RecommendationService.Vertex vertex(double latitude, double longitude) {
        return new RecommendationService.Vertex(latitude, longitude);
    }

    @Test
    void concavePolygonFiltersBothGridsAndCountsBoundaryPoints() {
        var polygon = List.of(vertex(0, 0), vertex(0, .02), vertex(.01, .02),
                vertex(.01, .01), vertex(.02, .01), vertex(.02, 0));
        PropagationEngine engine = mock(PropagationEngine.class);
        when(engine.calculateRsrp(any(), any(), anyDouble(), anyDouble())).thenReturn(-90.0);
        var result = new RecommendationService(engine).recommend(polygonRequest(polygon, 3, 3));
        assertEquals(8, result.candidateCount());
        assertEquals(8, result.targetCount());
        assertEquals(64, result.linkCount());
        assertEquals(8, result.coveredTargets());
        assertEquals(1, result.sites().size());
        verify(engine, times(64)).calculateRsrp(any(), argThat(tx ->
                !(tx.latitude() > .015 && tx.longitude() > .015)),
                doubleThat(lat -> lat >= 0 && lat <= .02), doubleThat(lon -> lon >= 0 && lon <= .02));
        verify(engine, never()).calculateRsrp(any(), any(), doubleThat(lat -> lat > .015),
                doubleThat(lon -> lon > .015));
    }

    @Test
    void rejectsInvalidPolygonsAndEmptyFilteredGridsBeforeEngine() {
        PropagationEngine engine = mock(PropagationEngine.class);
        RecommendationService service = new RecommendationService(engine);
        var diamond = List.of(vertex(0, .01), vertex(.01, .02), vertex(.02, .01), vertex(.01, 0));
        assertThrows(IllegalArgumentException.class, () -> service.recommend(polygonRequest(diamond, 2, 3)));
        assertThrows(IllegalArgumentException.class, () -> service.recommend(polygonRequest(diamond, 3, 2)));
        var crossing = List.of(vertex(0, 0), vertex(.02, .02), vertex(0, .02), vertex(.02, 0));
        assertThrows(IllegalArgumentException.class, () -> service.recommend(polygonRequest(crossing, 3, 3)));
        var repeated = List.of(vertex(0, 0), vertex(0, .02), vertex(0, .02), vertex(.02, 0));
        assertThrows(IllegalArgumentException.class, () -> service.recommend(polygonRequest(repeated, 3, 3)));
        var large = List.of(vertex(0, 0), vertex(0, .1), vertex(.1, 0));
        assertThrows(IllegalArgumentException.class, () -> service.recommend(polygonRequest(large, 3, 3)));
        assertThrows(IllegalArgumentException.class, () -> service.recommend(polygonRequest(
                java.util.Collections.nCopies(101, vertex(0, 0)), 3, 3)));
        verifyNoInteractions(engine);
    }

    @Test
    @EnabledIfSystemProperty(named = "recommendation.raster", matches = ".+")
    void localRasterProducesRepeatableRecommendation() {
        var engine = new PropagationEngine(new GeoTiffElevationModel(System.getProperty("recommendation.raster")));
        var service = new RecommendationService(engine);
        var local = new RecommendationService.Request(40.2897, -3.8244, 1.0, 4.0, 8.0, 2.0,
                -100.0, 3.5, 30.0, 1.5, 40.0, 15.0, 2.0);
        var result = service.recommend(local);
        assertEquals(1024, result.linkCount());
        assertTrue(result.coveredTargets() > 0);
        assertEquals(result, service.recommend(local));
        System.out.printf("Recomendación local: %d/%d objetivos, %d nodos, %d enlaces%n",
                result.coveredTargets(), result.targetCount(), result.sites().size(), result.linkCount());
    }

    @Test
    void httpRejectsInvalidInputAndReturnsResult() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new RecommendationController(
                new RecommendationService(new PropagationEngine((lat, lon) -> 0))))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        String body = """
                {"latitude":40,"longitude":-3,"areaKm":1,"candidateSide":2,"targetSide":2,
                 "nodes":2,"thresholdDbm":-100,"frequencyGHz":3.5,"txHeightM":30,
                 "rxHeightM":1.5,"txPowerDbm":40,"txGainDbi":15,"cableLossDb":2}
                """;
        mvc.perform(post("/api/recommendations").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.targetCount").value(4))
                .andExpect(jsonPath("$.sites").isArray());
        mvc.perform(post("/api/recommendations").contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("\"nodes\":2", "\"nodes\":1.5")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").exists());
        String polygon = body.replace("\"targetSide\":2", "\"targetSide\":3")
                .replace("\"nodes\":2", "\"nodes\":1")
                .replace("\"latitude\":40", "\"polygon\":[{\"latitude\":40,\"longitude\":-3},{\"latitude\":40,\"longitude\":-2.99},{\"latitude\":40.01,\"longitude\":-3}],\"latitude\":40");
        mvc.perform(post("/api/recommendations").contentType(MediaType.APPLICATION_JSON).content(polygon))
                .andExpect(status().isOk()).andExpect(jsonPath("$.targetCount").value(6))
                .andExpect(jsonPath("$.candidateCount").value(3));
    }
}
