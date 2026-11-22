package com.tfg.gemelo5g.service;

import com.tfg.gemelo5g.model.SimulationRequest;
import com.tfg.gemelo5g.model.TransmitterParameters;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.BitSet;
import java.util.List;

@Service
public class RecommendationService {
    private static final double PROFILE_SPACING_M = 100;
    private static final long MAX_LINKS = 14_400;
    private static final long MAX_PROFILE_SAMPLES = 1_500_000;
    private final PropagationEngine engine;

    public RecommendationService(PropagationEngine engine) {
        this.engine = engine;
    }

    public record Request(Double latitude, Double longitude, Double areaKm, Double candidateSide,
                          Double targetSide, Double nodes, Double thresholdDbm,
                          Double frequencyGHz, Double txHeightM, Double rxHeightM,
                          Double txPowerDbm, Double txGainDbi, Double cableLossDb, List<Vertex> polygon) {
        public Request(Double latitude, Double longitude, Double areaKm, Double candidateSide,
                       Double targetSide, Double nodes, Double thresholdDbm, Double frequencyGHz,
                       Double txHeightM, Double rxHeightM, Double txPowerDbm, Double txGainDbi, Double cableLossDb) {
            this(latitude, longitude, areaKm, candidateSide, targetSide, nodes, thresholdDbm,
                    frequencyGHz, txHeightM, rxHeightM, txPowerDbm, txGainDbi, cableLossDb, null);
        }
    }

    public record Vertex(Double latitude, Double longitude) {}

    public record Site(double latitude, double longitude, int newlyCovered, int cumulativeCovered) {}

    public record Result(Request request, String model, int candidateCount, int targetCount,
                         long linkCount, long maxProfileSamples, int coveredTargets,
                         List<Site> sites) {}

    public Result recommend(Request r) {
        if (r == null) throw new IllegalArgumentException("Falta la solicitud.");
        requireRange(r.thresholdDbm(), -139, -40, "Umbral (dBm)");
        requireRange(r.frequencyGHz(), 0.4, 7.125, "Frecuencia (GHz)");
        requireRange(r.txHeightM(), 1, 300, "Altura TX (m)");
        requireRange(r.rxHeightM(), 0.5, 10, "Altura RX (m)");
        requireRange(r.txPowerDbm(), 0, 60, "Potencia TX (dBm)");
        requireRange(r.txGainDbi(), 0, 50, "Ganancia TX (dBi)");
        requireRange(r.cableLossDb(), 0, 30, "Pérdida de cable (dB)");
        requireInteger(r.candidateSide(), 2, 8, "Candidatos por lado");
        requireInteger(r.targetSide(), 2, 15, "Objetivos por lado");
        int candidateSide = r.candidateSide().intValue(), targetSide = r.targetSide().intValue();
        requireInteger(r.nodes(), 1, Math.min(10, candidateSide * candidateSide), "Número de nodos");
        RecommendationPolygon polygon = r.polygon() == null ? null : new RecommendationPolygon(r.polygon());
        RecommendationPolygon.Bounds bounds;
        if (polygon == null) {
            requireRange(r.latitude(), -85, 85, "Latitud");
            requireRange(r.longitude(), -180, 180, "Longitud");
            requireRange(r.areaKm(), 0.1, 5, "Lado del área (km)");
            double dlat = r.areaKm() / 222;
            double dlon = dlat / Math.cos(Math.toRadians(r.latitude()));
            if (Math.abs(r.latitude()) + dlat > 85 || Math.abs(r.longitude()) + dlon > 180) {
                throw new IllegalArgumentException("El área no puede cruzar ±85° de latitud ni el antimeridiano.");
            }
            bounds = new RecommendationPolygon.Bounds(r.latitude() - dlat, r.longitude() - dlon,
                    r.latitude() + dlat, r.longitude() + dlon);
        } else {
            bounds = polygon.bounds();
        }
        List<Coordinate> candidateGrid = grid(bounds, candidateSide, polygon);
        List<Coordinate> targetGrid = grid(bounds, targetSide, polygon);
        int candidates = candidateGrid.size(), targets = targetGrid.size();
        if (candidates == 0 || targets == 0) {
            throw new IllegalArgumentException("El polígono no contiene candidatos o puntos objetivo de la rejilla; aumenta su resolución.");
        }
        long links = (long) candidates * targets;
        double closestLatitude = bounds.south() <= 0 && bounds.north() >= 0 ? 0
                : Math.min(Math.abs(bounds.south()), Math.abs(bounds.north()));
        double pathBound = Math.toRadians(bounds.north() - bounds.south()
                + (bounds.east() - bounds.west()) * Math.cos(Math.toRadians(closestLatitude))) * 6_371_000;
        long samples = links * (Math.max(1L, (long) Math.ceil(pathBound / PROFILE_SPACING_M)) + 1);
        if (links > MAX_LINKS || samples > MAX_PROFILE_SAMPLES) {
            throw new IllegalArgumentException("El coste estimado supera el límite de cálculo.");
        }

        List<BitSet> coverage = new ArrayList<>(candidates);
        for (Coordinate candidate : candidateGrid) {
            TransmitterParameters tx = new TransmitterParameters(candidate.lat(), candidate.lon(),
                    r.txHeightM(), r.txPowerDbm(), r.txGainDbi());
            SimulationRequest simulation = new SimulationRequest("Recomendación", r.frequencyGHz(),
                    r.rxHeightM(), 1.0, PROFILE_SPACING_M, r.cableLossDb(), List.of(tx));
            BitSet covered = new BitSet(targets);
            for (int i = 0; i < targets; i++) {
                Coordinate target = targetGrid.get(i);
                if (engine.calculateRsrp(simulation, tx, target.lat(), target.lon()) >= r.thresholdDbm()) {
                    covered.set(i);
                }
            }
            coverage.add(covered);
        }

        BitSet alreadyCovered = new BitSet(targets);
        List<Site> chosen = new ArrayList<>();
        for (int n = 0; n < r.nodes(); n++) {
            int best = -1, bestGain = 0;
            for (int i = 0; i < candidates; i++) {
                BitSet gain = (BitSet) coverage.get(i).clone();
                gain.andNot(alreadyCovered);
                if (gain.cardinality() > bestGain) {
                    best = i;
                    bestGain = gain.cardinality();
                }
            }
            if (best < 0) break;
            alreadyCovered.or(coverage.get(best));
            Coordinate site = candidateGrid.get(best);
            chosen.add(new Site(site.lat(), site.lon(), bestGain, alreadyCovered.cardinality()));
        }
        return new Result(r, "FSPL+Deygout; proxy normalizado 66×12", candidates, targets,
                links, samples, alreadyCovered.cardinality(), List.copyOf(chosen));
    }

    private record Coordinate(double lat, double lon) {}

    private static List<Coordinate> grid(RecommendationPolygon.Bounds bounds, int side,
                                         RecommendationPolygon polygon) {
        List<Coordinate> grid = new ArrayList<>(side * side);
        for (int x = 0; x < side; x++) {
            for (int y = 0; y < side; y++) {
                double latitude = bounds.south() + (bounds.north() - bounds.south()) * y / (side - 1);
                double longitude = bounds.west() + (bounds.east() - bounds.west()) * x / (side - 1);
                if (polygon == null || polygon.contains(latitude, longitude)) {
                    grid.add(new Coordinate(latitude, longitude));
                }
            }
        }
        return grid;
    }

    private static void requireRange(Double value, double min, double max, String label) {
        if (value == null || !Double.isFinite(value) || value < min || value > max) {
            throw new IllegalArgumentException(label + " debe estar entre " + min + " y " + max + ".");
        }
    }

    private static void requireInteger(Double value, int min, int max, String label) {
        if (value == null || !Double.isFinite(value) || value != Math.rint(value) || value < min || value > max) {
            throw new IllegalArgumentException(label + " debe estar entre " + min + " y " + max + ".");
        }
    }
}
