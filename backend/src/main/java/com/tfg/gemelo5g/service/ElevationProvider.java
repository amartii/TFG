package com.tfg.gemelo5g.service;

@FunctionalInterface
public interface ElevationProvider {
    double elevationAt(double latitude, double longitude);
}
