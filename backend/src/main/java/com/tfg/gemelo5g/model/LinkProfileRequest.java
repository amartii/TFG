package com.tfg.gemelo5g.model;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record LinkProfileRequest(
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double receiverLatitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double receiverLongitude
) {}
