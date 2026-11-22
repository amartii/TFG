package com.tfg.gemelo5g.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SimulationRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull @DecimalMin("0.4") @DecimalMax("7.125") Double frequencyGHz,
        @NotNull @DecimalMin("0.5") @DecimalMax("10.0") Double rxHeightM,
        @NotNull @DecimalMin("0.1") @DecimalMax("50.0") Double areaKm,
        @NotNull @DecimalMin("10.0") @DecimalMax("10000.0") Double gridSpacingM,
        @NotNull @DecimalMin("0.0") @DecimalMax("30.0") Double cableLossDb,
        @NotEmpty @Size(max = 1) List<@NotNull @Valid TransmitterParameters> transmitters,
        @DecimalMin("0.0") @DecimalMax("40.0") Double clutterLossDb
) {
    public static final long MAX_GRID_POINTS = 100_000;
    public static final long MAX_PROFILE_SAMPLES = 20_000_000;
    private static final double GRID_RATIO_EPSILON = 1e-9;

    public SimulationRequest(String name, Double frequencyGHz, Double rxHeightM, Double areaKm,
            Double gridSpacingM, Double cableLossDb, List<TransmitterParameters> transmitters) {
        this(name, frequencyGHz, rxHeightM, areaKm, gridSpacingM, cableLossDb, transmitters, null);
    }

    @AssertTrue(message = "La rejilla debe tener al menos 2 puntos por lado y no superar 100.000 puntos")
    public boolean isGridPointCountValid() {
        if (areaKm == null || gridSpacingM == null || !Double.isFinite(areaKm)
                || !Double.isFinite(gridSpacingM) || areaKm <= 0 || gridSpacingM <= 0) {
            return true;
        }
        double intervalsPerSide = Math.ceil(areaKm * 1000 / gridSpacingM - GRID_RATIO_EPSILON);
        double pointsPerSide = intervalsPerSide + 1;
        return intervalsPerSide >= 1 && pointsPerSide * pointsPerSide <= MAX_GRID_POINTS;
    }

    public long gridIntervalsPerSide() {
        return Math.max(1L,
                (long) Math.ceil(areaKm * 1000 / gridSpacingM - GRID_RATIO_EPSILON));
    }

    public long gridPointsPerSide() {
        return gridIntervalsPerSide() + 1;
    }

    public double actualGridSpacingM() {
        return areaKm * 1000 / gridIntervalsPerSide();
    }

    @AssertTrue(message = "El área centrada en la antena debe mantenerse dentro de coordenadas geográficas válidas")
    public boolean isGridExtentValid() {
        if (transmitters == null || transmitters.isEmpty() || transmitters.get(0) == null
                || areaKm == null || !Double.isFinite(areaKm) || areaKm <= 0) return true;
        TransmitterParameters center = transmitters.get(0);
        if (center.latitude() == null || center.longitude() == null
                || !Double.isFinite(center.latitude()) || !Double.isFinite(center.longitude())) return true;
        double latitudeDelta = areaKm / 2 / 111;
        double cosine = Math.cos(Math.toRadians(center.latitude()));
        if (cosine <= 1e-6) return false;
        double longitudeDelta = latitudeDelta / cosine;
        return center.latitude() - latitudeDelta >= -90 && center.latitude() + latitudeDelta <= 90
                && center.longitude() - longitudeDelta >= -180 && center.longitude() + longitudeDelta <= 180;
    }

    @AssertTrue(message = "La simulación excede el límite de 20.000.000 muestras de perfiles")
    public boolean isProfileWorkValid() {
        if (transmitters == null || transmitters.isEmpty() || transmitters.get(0) == null
                || areaKm == null || gridSpacingM == null || !Double.isFinite(areaKm)
                || !Double.isFinite(gridSpacingM) || areaKm <= 0 || gridSpacingM <= 0
                || !isGridPointCountValid() || !isGridExtentValid()) return true;
        TransmitterParameters center = transmitters.get(0);
        if (center.latitude() == null || center.longitude() == null) return true;
        // Upper bound for the grid's latitude/longitude paths, including polar grids.
        double maxPath = areaKm * 1000 * (1 + 1 / Math.max(0.001,
                Math.abs(Math.cos(Math.toRadians(center.latitude())))));
        double samples = Math.ceil(maxPath / Math.max(30, gridSpacingM)) + 1;
        return samples * gridPointsPerSide() * gridPointsPerSide() <= MAX_PROFILE_SAMPLES;
    }
}
