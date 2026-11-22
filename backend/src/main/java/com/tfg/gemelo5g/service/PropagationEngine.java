package com.tfg.gemelo5g.service;

import com.tfg.gemelo5g.model.CoveragePointDto;
import com.tfg.gemelo5g.model.LinkProfileDto;
import com.tfg.gemelo5g.model.LinkProfilePointDto;
import com.tfg.gemelo5g.model.SimulationRequest;
import com.tfg.gemelo5g.model.TransmitterParameters;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

@Service
public class PropagationEngine {
    private static final double SPEED_OF_LIGHT_M_S = 299_792_458;
    private static final double EFFECTIVE_EARTH_RADIUS_M = 4.0 / 3.0 * 6_371_000;
    private static final int ASSUMED_RESOURCE_BLOCKS = 66;
    private static final double RESOURCE_ELEMENT_OFFSET_DB =
            10 * Math.log10(ASSUMED_RESOURCE_BLOCKS * 12);
    private static final double MIN_RSRP_DBM = -140;
    private static final double MAX_RSRP_DBM = -40;

    private final ElevationProvider terrain;

    public PropagationEngine(ElevationProvider terrain) {
        this.terrain = terrain;
    }

    public List<CoveragePointDto> calculateGrid(SimulationRequest request) {
        TransmitterParameters transmitter = request.transmitters().get(0);
        int pointsPerSide = Math.toIntExact(request.gridPointsPerSide());
        double latitudeDelta = request.areaKm() / 2 / 111;
        double longitudeDelta = request.areaKm() / 2
                / (111 * Math.cos(Math.toRadians(transmitter.latitude())));
        List<CoveragePointDto> points = new ArrayList<>(pointsPerSide * pointsPerSide);

        for (int longitudeIndex = 0; longitudeIndex < pointsPerSide; longitudeIndex++) {
            double longitude = interpolate(
                    transmitter.longitude() - longitudeDelta,
                    transmitter.longitude() + longitudeDelta,
                    longitudeIndex,
                    pointsPerSide);
            for (int latitudeIndex = 0; latitudeIndex < pointsPerSide; latitudeIndex++) {
                double latitude = interpolate(
                        transmitter.latitude() - latitudeDelta,
                        transmitter.latitude() + latitudeDelta,
                        latitudeIndex,
                        pointsPerSide);
                double rsrp = calculateRsrp(request, transmitter, latitude, longitude);
                if (rsrp >= -130) {
                    points.add(new CoveragePointDto(latitude, longitude, rsrp));
                }
            }
        }
        return points;
    }

    public double calculateRsrp(
            SimulationRequest request,
            TransmitterParameters transmitter,
            double receiverLatitude,
            double receiverLongitude) {
        return clampRsrp(calculateRawRsrp(request, transmitter, receiverLatitude, receiverLongitude));
    }

    private double calculateRawRsrp(
            SimulationRequest request, TransmitterParameters transmitter,
            double receiverLatitude, double receiverLongitude) {
        double horizontalDistance = distanceMeters(
                transmitter.latitude(), transmitter.longitude(), receiverLatitude, receiverLongitude);
        double distance = Math.max(horizontalDistance, 1);
        double frequencyHz = request.frequencyGHz() * 1e9;
        double wavelength = SPEED_OF_LIGHT_M_S / frequencyHz;
        int intervals = Math.max(1, (int) Math.ceil(distance / Math.max(30, request.gridSpacingM())));
        double[] profileDistances = new double[intervals + 1];
        double[] effectiveTerrainHeights = new double[intervals + 1];

        for (int i = 0; i <= intervals; i++) {
            double fraction = (double) i / intervals;
            double latitude = transmitter.latitude()
                    + (receiverLatitude - transmitter.latitude()) * fraction;
            double longitude = transmitter.longitude()
                    + (receiverLongitude - transmitter.longitude()) * fraction;
            double alongPath = distance * fraction;
            double elevation = terrain.elevationAt(latitude, longitude);
            double heightAboveCurvedEarth = elevation
                    + alongPath * (distance - alongPath) / (2 * EFFECTIVE_EARTH_RADIUS_M);
            if (i == 0) {
                effectiveTerrainHeights[i] = elevation + transmitter.txHeightM();
            } else if (i == intervals) {
                effectiveTerrainHeights[i] = elevation + request.rxHeightM();
            } else {
                effectiveTerrainHeights[i] = heightAboveCurvedEarth;
            }
            profileDistances[i] = alongPath;
        }

        double pathLoss = freeSpacePathLossDb(distance, frequencyHz)
                + deygoutDiffractionLossDb(profileDistances, effectiveTerrainHeights, wavelength);
        pathLoss += request.clutterLossDb() == null ? 0 : request.clutterLossDb();
        pathLoss += directionalAntennaLossDb(
                transmitter, receiverLatitude, receiverLongitude, horizontalDistance,
                effectiveTerrainHeights[0], effectiveTerrainHeights[intervals]);
        double eirp = transmitter.txPowerDbm() + transmitter.txGainDbi() - request.cableLossDb();
        return eirp - pathLoss - RESOURCE_ELEMENT_OFFSET_DB;
    }

    private static double clampRsrp(double rsrp) {
        return Math.max(MIN_RSRP_DBM, Math.min(MAX_RSRP_DBM, rsrp));
    }

    public LinkProfileDto calculateLinkProfile(
            double transmitterLatitude, double transmitterLongitude, double transmitterHeightM,
            double receiverLatitude, double receiverLongitude, double receiverHeightM,
            double frequencyGHz, double sampleSpacingM) {
        double distance = distanceMeters(
                transmitterLatitude, transmitterLongitude, receiverLatitude, receiverLongitude);
        if (!Double.isFinite(distance) || distance <= 1 || distance > 100_000) {
            throw new IllegalArgumentException("La longitud del perfil debe estar entre 1 m y 100 km.");
        }
        if (!Double.isFinite(frequencyGHz) || frequencyGHz < 0.4 || frequencyGHz > 7.125
                || !Double.isFinite(sampleSpacingM) || sampleSpacingM <= 0
                || !Double.isFinite(transmitterHeightM) || transmitterHeightM < 0
                || !Double.isFinite(receiverHeightM) || receiverHeightM < 0) {
            throw new IllegalArgumentException("Frecuencia, espaciado y alturas del perfil deben ser válidos.");
        }
        double wavelength = SPEED_OF_LIGHT_M_S / (frequencyGHz * 1e9);
        int intervals = Math.max(1, (int) Math.ceil(distance / Math.max(30, sampleSpacingM)));
        double txGround = terrain.elevationAt(transmitterLatitude, transmitterLongitude);
        double rxGround = terrain.elevationAt(receiverLatitude, receiverLongitude);
        double txAbsolute = txGround + transmitterHeightM;
        double rxAbsolute = rxGround + receiverHeightM;
        List<LinkProfilePointDto> samples = new ArrayList<>(intervals + 1);
        double maxRadius = 0;
        for (int i = 0; i <= intervals; i++) {
            double fraction = (double) i / intervals;
            double latitude = transmitterLatitude + (receiverLatitude - transmitterLatitude) * fraction;
            double longitude = transmitterLongitude + (receiverLongitude - transmitterLongitude) * fraction;
            double alongPath = distance * fraction;
            double elevation = i == 0 ? txGround
                    : i == intervals ? rxGround : terrain.elevationAt(latitude, longitude);
            double bulge = alongPath * (distance - alongPath) / (2 * EFFECTIVE_EARTH_RADIUS_M);
            double lineHeight = txAbsolute + (rxAbsolute - txAbsolute) * fraction;
            double fresnelRadius = Math.sqrt(wavelength * alongPath * (distance - alongPath) / distance);
            maxRadius = Math.max(maxRadius, fresnelRadius);
            samples.add(new LinkProfilePointDto(
                    alongPath, elevation, elevation + bulge, lineHeight, fresnelRadius,
                    lineHeight - fresnelRadius, lineHeight + fresnelRadius));
        }
        return new LinkProfileDto(distance, frequencyGHz, wavelength, maxRadius, samples);
    }

    static double directionalAntennaLossDb(
            TransmitterParameters transmitter, double receiverLatitude, double receiverLongitude,
            double distanceM, double txAbsoluteHeightM, double rxAbsoluteHeightM) {
        if (transmitter.antennaAzimuthDeg() == null || transmitter.antennaDowntiltDeg() == null) {
            return 0;
        }
        double lat1 = Math.toRadians(transmitter.latitude());
        double lat2 = Math.toRadians(receiverLatitude);
        double deltaLongitude = Math.toRadians(receiverLongitude - transmitter.longitude());
        double bearing = Math.toDegrees(Math.atan2(
                Math.sin(deltaLongitude) * Math.cos(lat2),
                Math.cos(lat1) * Math.sin(lat2)
                        - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLongitude)));
        bearing = (bearing + 360) % 360;
        double azimuthError = Math.abs((bearing - transmitter.antennaAzimuthDeg() + 540) % 360 - 180);
        double elevation = Math.toDegrees(Math.atan2(rxAbsoluteHeightM - txAbsoluteHeightM, Math.max(1, distanceM)));
        double elevationError = Math.abs(elevation + transmitter.antennaDowntiltDeg());
        double horizontalLoss = 12 * Math.pow(azimuthError / 65, 2);
        double verticalLoss = 12 * Math.pow(elevationError / 10, 2);
        return Math.min(30, horizontalLoss + verticalLoss);
    }

    static double freeSpacePathLossDb(double distanceM, double frequencyHz) {
        double safeDistance = Math.max(distanceM, 1);
        return 20 * Math.log10(safeDistance)
                + 20 * Math.log10(frequencyHz)
                + 20 * Math.log10(4 * Math.PI / SPEED_OF_LIGHT_M_S);
    }

    static double deygoutDiffractionLossDb(
            double[] distances, double[] effectiveHeights, double wavelength) {
        if (distances.length != effectiveHeights.length || distances.length < 3) {
            return 0;
        }
        double totalLoss = 0;
        ArrayDeque<Segment> pending = new ArrayDeque<>();
        pending.push(new Segment(0, distances.length - 1));
        while (!pending.isEmpty()) {
            Segment segment = pending.pop();
            if (segment.end - segment.start < 2) {
                continue;
            }
            int dominantIndex = -1;
            double dominantV = Double.NEGATIVE_INFINITY;
            double segmentLength = distances[segment.end] - distances[segment.start];
            for (int i = segment.start + 1; i < segment.end; i++) {
                double d1 = distances[i] - distances[segment.start];
                double d2 = distances[segment.end] - distances[i];
                double lineHeight = effectiveHeights[segment.start]
                        + (effectiveHeights[segment.end] - effectiveHeights[segment.start])
                        * d1 / segmentLength;
                double obstruction = effectiveHeights[i] - lineHeight;
                double v = obstruction * Math.sqrt(2 * (d1 + d2) / (wavelength * d1 * d2));
                if (v > dominantV) {
                    dominantV = v;
                    dominantIndex = i;
                }
            }
            if (dominantIndex < 0 || dominantV <= -0.78) {
                continue;
            }
            totalLoss += knifeEdgeLossDb(dominantV);
            pending.push(new Segment(segment.start, dominantIndex));
            pending.push(new Segment(dominantIndex, segment.end));
        }
        return totalLoss;
    }

    static double knifeEdgeLossDb(double v) {
        if (v <= -0.78) {
            return 0;
        }
        double shifted = v - 0.1;
        return 6.9 + 20 * Math.log10(Math.sqrt(shifted * shifted + 1) + shifted);
    }

    private static double interpolate(double from, double to, int index, int count) {
        return count == 1 ? (from + to) / 2 : from + (to - from) * index / (count - 1);
    }

    private static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double lat1Rad = Math.toRadians(lat1);
        double lat2Rad = Math.toRadians(lat2);
        double deltaLat = Math.toRadians(lat2 - lat1);
        double deltaLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(lat1Rad) * Math.cos(lat2Rad)
                * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        return 2 * 6_371_000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private record Segment(int start, int end) {}
}
