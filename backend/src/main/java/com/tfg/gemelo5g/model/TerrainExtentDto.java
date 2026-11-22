package com.tfg.gemelo5g.model;

public record TerrainExtentDto(
        double westLongitude,
        double southLatitude,
        double eastLongitude,
        double northLatitude,
        double longitudePixelSizeDeg,
        double latitudePixelSizeDeg,
        Double noDataValue,
        boolean containsNoDataCells
) {}
