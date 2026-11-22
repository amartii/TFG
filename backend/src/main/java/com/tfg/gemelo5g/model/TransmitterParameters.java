package com.tfg.gemelo5g.model;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;

public record TransmitterParameters(
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
        @NotNull @DecimalMin("1.0") @DecimalMax("300.0") Double txHeightM,
        @NotNull @DecimalMin("0.0") @DecimalMax("60.0") Double txPowerDbm,
        @NotNull @DecimalMin("0.0") @DecimalMax("50.0") Double txGainDbi,
        @DecimalMin("0.0") @DecimalMax("360.0") Double antennaAzimuthDeg,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double antennaDowntiltDeg
) {
    public TransmitterParameters(Double latitude, Double longitude, Double txHeightM,
            Double txPowerDbm, Double txGainDbi) {
        this(latitude, longitude, txHeightM, txPowerDbm, txGainDbi, null, null);
    }

    @AssertTrue(message = "El patrón direccional requiere azimut e inclinación")
    public boolean isDirectionalPatternComplete() {
        return (antennaAzimuthDeg == null) == (antennaDowntiltDeg == null);
    }
}
