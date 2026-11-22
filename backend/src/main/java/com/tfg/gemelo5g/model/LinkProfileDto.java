package com.tfg.gemelo5g.model;

import java.util.List;

public record LinkProfileDto(
        double distanceM,
        double frequencyGHz,
        double wavelengthM,
        double firstFresnelRadiusMaxM,
        List<LinkProfilePointDto> samples
) {}
