package com.tfg.gemelo5g.service;

import java.util.ArrayList;
import java.util.List;
import com.tfg.gemelo5g.service.RecommendationService.Vertex;

final class RecommendationPolygon {
    record Bounds(double south, double west, double north, double east) {}
    private static final double EPS = 1e-12;
    private final List<Vertex> vertices;
    private final Bounds bounds;

    RecommendationPolygon(List<Vertex> input) {
        if (input == null || input.size() < 3 || input.size() > 100) {
            throw new IllegalArgumentException("El polígono debe tener entre 3 y 100 vértices.");
        }
        List<Vertex> points = new ArrayList<>(input);
        for (Vertex v : points) {
            if (v == null || v.latitude() == null || v.longitude() == null
                    || !Double.isFinite(v.latitude()) || !Double.isFinite(v.longitude())
                    || Math.abs(v.latitude()) > 85 || Math.abs(v.longitude()) > 180) {
                throw new IllegalArgumentException("Vértice del polígono fuera de coordenadas válidas.");
            }
        }
        if (points.get(0).equals(points.get(points.size() - 1))) points.remove(points.size() - 1);
        if (points.size() < 3) throw new IllegalArgumentException("El polígono necesita tres vértices distintos.");
        if (points.stream().distinct().count() != points.size()) {
            throw new IllegalArgumentException("El polígono contiene vértices repetidos.");
        }
        double south = points.stream().mapToDouble(Vertex::latitude).min().orElseThrow();
        double north = points.stream().mapToDouble(Vertex::latitude).max().orElseThrow();
        double west = points.stream().mapToDouble(Vertex::longitude).min().orElseThrow();
        double east = points.stream().mapToDouble(Vertex::longitude).max().orElseThrow();
        double midLat = (south + north) / 2;
        if (north - south <= 0 || east - west <= 0
                || (north - south) * 111.2 > 5
                || (east - west) * 111.2 * Math.cos(Math.toRadians(midLat)) > 5) {
            throw new IllegalArgumentException("La envolvente del polígono debe medir como máximo 5 km por lado y no cruzar el antimeridiano.");
        }
        int n = points.size();
        double twiceArea = 0;
        for (int i = 0; i < n; i++) {
            Vertex a = points.get(i), b = points.get((i + 1) % n), c = points.get((i + 2) % n);
            twiceArea += (a.longitude() - west) * (b.latitude() - south)
                    - (b.longitude() - west) * (a.latitude() - south);
            if (Math.abs(cross(a, b, c)) <= EPS
                    && (a.longitude() - b.longitude()) * (c.longitude() - b.longitude())
                    + (a.latitude() - b.latitude()) * (c.latitude() - b.latitude()) > 0) {
                throw new IllegalArgumentException("El polígono contiene aristas solapadas.");
            }
            for (int j = i + 1; j < n; j++) {
                if (j == i + 1 || (i == 0 && j == n - 1)) continue;
                if (intersects(a, b, points.get(j), points.get((j + 1) % n))) {
                    throw new IllegalArgumentException("El polígono se cruza o se toca a sí mismo.");
                }
            }
        }
        if (Math.abs(twiceArea) <= EPS) throw new IllegalArgumentException("El polígono tiene área nula.");
        this.vertices = List.copyOf(points);
        this.bounds = new Bounds(south, west, north, east);
    }

    Bounds bounds() { return bounds; }

    boolean contains(double latitude, double longitude) {
        Vertex p = new Vertex(latitude, longitude);
        boolean inside = false;
        for (int i = 0; i < vertices.size(); i++) {
            Vertex a = vertices.get(i), b = vertices.get((i + 1) % vertices.size());
            if (onSegment(a, b, p)) return true;
            if ((a.latitude() > latitude) != (b.latitude() > latitude)
                    && longitude < (b.longitude() - a.longitude()) * (latitude - a.latitude())
                    / (b.latitude() - a.latitude()) + a.longitude()) inside = !inside;
        }
        return inside;
    }

    private static double cross(Vertex a, Vertex b, Vertex c) {
        return (b.longitude() - a.longitude()) * (c.latitude() - a.latitude())
                - (b.latitude() - a.latitude()) * (c.longitude() - a.longitude());
    }

    private static boolean onSegment(Vertex a, Vertex b, Vertex p) {
        return Math.abs(cross(a, b, p)) <= EPS
                && p.longitude() >= Math.min(a.longitude(), b.longitude()) - EPS
                && p.longitude() <= Math.max(a.longitude(), b.longitude()) + EPS
                && p.latitude() >= Math.min(a.latitude(), b.latitude()) - EPS
                && p.latitude() <= Math.max(a.latitude(), b.latitude()) + EPS;
    }

    private static boolean intersects(Vertex a, Vertex b, Vertex c, Vertex d) {
        double abC = cross(a, b, c), abD = cross(a, b, d);
        double cdA = cross(c, d, a), cdB = cross(c, d, b);
        if (onSegment(a, b, c) || onSegment(a, b, d)
                || onSegment(c, d, a) || onSegment(c, d, b)) return true;
        return ((abC > EPS && abD < -EPS) || (abC < -EPS && abD > EPS))
                && ((cdA > EPS && cdB < -EPS) || (cdA < -EPS && cdB > EPS));
    }
}
