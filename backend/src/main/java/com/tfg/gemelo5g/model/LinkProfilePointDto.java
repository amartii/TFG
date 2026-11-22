package com.tfg.gemelo5g.model;

public record LinkProfilePointDto(
        double distanceM,
        double terrainElevationM,
        double effectiveTerrainHeightM,
        double lineOfSightHeightM,
        double fresnelRadiusM,
        double firstFresnelLowerM,
        double firstFresnelUpperM
) {}
