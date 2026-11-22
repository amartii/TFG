package com.tfg.gemelo5g.service;

import com.tfg.gemelo5g.model.SimulationRequest;
import com.tfg.gemelo5g.model.TransmitterParameters;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PropagationEngineTest {

    @Test
    void freeSpacePathLossMatchesAnalyticalValue() {
        assertEquals(103.33,
                PropagationEngine.freeSpacePathLossDb(1_000, 3.5e9), 0.02);
    }

    @Test
    void flatTerrainRsrpUsesEirpAndMatlabResourceElementOffset() {
        PropagationEngine engine = new PropagationEngine((latitude, longitude) -> 0);
        SimulationRequest request = new SimulationRequest(
                "Analytical case", 3.5, 1.5, 1.0, 100.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0)));
        double receiverLatitude = 40.0 + 1_000.0 / 111_000;

        double result = engine.calculateRsrp(request, request.transmitters().get(0),
                receiverLatitude, -4.0);
        double expected = 53.0
                - PropagationEngine.freeSpacePathLossDb(1_000, 3.5e9)
                - 10 * Math.log10(66 * 12);

        assertEquals(expected, result, 0.15);
    }

    @Test
    void knifeEdgeDiffractionMatchesSingleEdgeFormula() {
        double actual = PropagationEngine.deygoutDiffractionLossDb(
                new double[]{0, 500, 1_000},
                new double[]{0, 0, 0},
                0.1);

        assertEquals(PropagationEngine.knifeEdgeLossDb(0), actual, 1e-9);
    }

    @Test
    void clearProfileHasNoDiffractionLoss() {
        double loss = PropagationEngine.deygoutDiffractionLossDb(
                new double[]{0, 500, 1_000},
                new double[]{30, 0, 1.5},
                0.1);

        assertEquals(0, loss, 1e-9);
    }

    @Test
    void gridIncludesBothAreaEdgesAndKeepsActualSpacingWithinRequest() {
        PropagationEngine engine = new PropagationEngine((latitude, longitude) -> 0);
        SimulationRequest request = new SimulationRequest(
                "Grid semantics", 3.5, 1.5, 0.11, 50.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0)));

        List<com.tfg.gemelo5g.model.CoveragePointDto> points = engine.calculateGrid(request);

        assertEquals(16, points.size());
        assertEquals(40.0 - 0.11 / 2 / 111, points.get(0).lat(), 1e-12);
        assertEquals(40.0 + 0.11 / 2 / 111, points.get(3).lat(), 1e-12);
        double actualSpacingM = (points.get(1).lat() - points.get(0).lat()) * 111_000;
        assertEquals(110.0 / 3, actualSpacingM, 1e-6);
        assertTrue(actualSpacingM <= request.gridSpacingM());
    }

    @Test
    void singleTransmitterGridMatchesRsrpCalculation() {
        PropagationEngine engine = new PropagationEngine((latitude, longitude) -> 0);
        TransmitterParameters transmitter = new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0);
        SimulationRequest request = new SimulationRequest("one", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(transmitter));
        var points = engine.calculateGrid(request);
        assertEquals(9, points.size());
        for (var point : points) {
            assertEquals(engine.calculateRsrp(request, transmitter, point.lat(), point.lng()),
                    point.rsrp(), 1e-10);
        }
    }

    @Test
    void gridOmitsPointsBelowLegacyDisplayFloor() {
        PropagationEngine engine = new PropagationEngine((latitude, longitude) -> 0);
        SimulationRequest request = new SimulationRequest("holes", 7.0, 1.5, 5.0, 2500.0, 30.0,
                List.of(new TransmitterParameters(40.0, -4.0, 1.0, -100.0, 0.0)));
        List<com.tfg.gemelo5g.model.CoveragePointDto> points = engine.calculateGrid(request);
        assertTrue(points.isEmpty());
    }

    @Test
    void noClutterOrPatternKeepsLegacyPredictionAndManualClutterIsAdditive() {
        PropagationEngine engine = new PropagationEngine((latitude, longitude) -> 0);
        TransmitterParameters transmitter = new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0);
        SimulationRequest legacy = new SimulationRequest(
                "Default", 3.5, 1.5, 1.0, 100.0, 2.0, List.of(transmitter));
        SimulationRequest explicitlyDisabled = new SimulationRequest(
                "Default", 3.5, 1.5, 1.0, 100.0, 2.0, List.of(transmitter), null);
        SimulationRequest cluttered = new SimulationRequest(
                "Clutter", 3.5, 1.5, 1.0, 100.0, 2.0, List.of(transmitter), 5.0);
        double receiverLatitude = 40.001;

        double expected = engine.calculateRsrp(legacy, transmitter, receiverLatitude, -4.0);
        assertEquals(expected, engine.calculateRsrp(explicitlyDisabled, transmitter, receiverLatitude, -4.0), 0);
        assertEquals(expected - 5, engine.calculateRsrp(cluttered, transmitter, receiverLatitude, -4.0), 1e-10);
    }

    @Test
    void directionalPatternIsOmnidirectionalWhenOmittedAndAttenuatesOffAxis() {
        TransmitterParameters omni = new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0);
        TransmitterParameters northSector = new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0, 0.0, 0.0);

        assertEquals(0, PropagationEngine.directionalAntennaLossDb(omni, 41, -4, 1_000,
                100, 100), 0);
        assertEquals(0, PropagationEngine.directionalAntennaLossDb(northSector, 41, -4, 1_000,
                100, 100), 1e-12);
        assertEquals(12 * Math.pow(90.0 / 65.0, 2),
                PropagationEngine.directionalAntennaLossDb(northSector, 40, -3.999, 1_000,
                        100, 100), 0.01);
        assertEquals(30, PropagationEngine.directionalAntennaLossDb(northSector, 39, -4, 1_000,
                100, 100), 1e-12);
        double halfBeamLatitude = 40 + Math.cos(Math.toRadians(32.5)) * 1_000 / 111_000;
        double halfBeamLongitude = -4 + Math.sin(Math.toRadians(32.5)) * 1_000
                / (111_000 * Math.cos(Math.toRadians(40)));
        assertEquals(3.0, PropagationEngine.directionalAntennaLossDb(northSector,
                halfBeamLatitude, halfBeamLongitude, 1_000, 100, 100), 0.1);
        TransmitterParameters downtilted = new TransmitterParameters(40.0, -4.0, 30.0,
                40.0, 15.0, 0.0, 5.0);
        assertEquals(0, PropagationEngine.directionalAntennaLossDb(downtilted, 41, -4,
                1_000, 100, 100 - 1_000 * Math.tan(Math.toRadians(5))), 1e-10);
    }

    @Test
    void directionalPatternAppliesToSingleTransmitter() {
        PropagationEngine engine = new PropagationEngine((lat, lon) -> 0);
        TransmitterParameters sector = new TransmitterParameters(40.0, -4.0, 1.5, 50.0, 15.0, 0.0, 0.0);
        SimulationRequest request = new SimulationRequest("sector", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(sector), 4.0);
        var points = engine.calculateGrid(request);
        assertEquals(9, points.size());
        assertTrue(points.stream().allMatch(p -> Double.isFinite(p.rsrp())));
    }

    @Test
    void linkProfileReportsFirstFresnelRadiusAndRejectsUnboundedDistance() {
        PropagationEngine engine = new PropagationEngine((latitude, longitude) -> 100);
        double receiverLatitude = 40.009;
        var profile = engine.calculateLinkProfile(40, -4, 30, receiverLatitude, -4,
                1.5, 3.5, 50);
        double expectedMidRadius = Math.sqrt(profile.wavelengthM() * profile.distanceM() / 4);

        assertTrue(profile.samples().size() > 2);
        assertEquals(expectedMidRadius, profile.firstFresnelRadiusMaxM(), 0.1);
        assertEquals(100, profile.samples().get(0).terrainElevationM(), 0);
        assertEquals(130, profile.samples().get(0).lineOfSightHeightM(), 0);
        assertEquals(0, profile.samples().get(0).fresnelRadiusM(), 0);
        assertThrows(IllegalArgumentException.class, () -> engine.calculateLinkProfile(
                40, -4, 30, 42, -4, 1.5, 3.5, 50));
    }
}
