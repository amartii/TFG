package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class CalibrationService {
    private static final String QUANTITY = "prototype_power_proxy";
    private static final long MAX_COMPARISONS = 10_000_000L;
    private static final Logger log = LoggerFactory.getLogger(CalibrationService.class);
    private final SimulationService simulations;
    private final ObjectMapper mapper;
    private final Path directory;

    public CalibrationService(SimulationService simulations, ObjectMapper mapper,
            @Value("${simulations.data-dir}") String dataDir) {
        this.simulations = simulations;
        this.mapper = mapper;
        this.directory = Path.of(dataDir).toAbsolutePath().normalize().resolve("calibrations");
    }

    public JsonNode create(String simulationId, JsonNode input) throws IOException {
        JsonNode simulation = simulations.getById(simulationId);
        JsonNode observations = input.path("observations");
        if (!observations.isArray() || observations.isEmpty() || observations.size() > 10000) {
            throw new IllegalArgumentException("observations debe contener entre 1 y 10000 registros.");
        }
        JsonNode grid = simulation.path("coveragePoints");
        double spacing = simulation.path("parameters").path("espaciado_grid_m").asDouble(Double.NaN);
        if (!grid.isArray() || grid.isEmpty() || !Double.isFinite(spacing) || spacing <= 0) {
            throw new IllegalArgumentException("La predicción no contiene una malla y espaciado válidos.");
        }
        checkComparisonBudget(grid.size(), observations.size());
        List<Point> points = new ArrayList<>();
        for (JsonNode p : grid) {
            if (!number(p, "lat") || !number(p, "lng") || !number(p, "rsrp")
                    || p.path("rsrp").doubleValue() < -300 || p.path("rsrp").doubleValue() > 100
                    || Math.abs(p.path("lat").doubleValue()) > 90 || Math.abs(p.path("lng").doubleValue()) > 180) {
                throw new IllegalArgumentException("La predicción contiene puntos inválidos.");
            }
            points.add(new Point(p.path("lat").doubleValue(), p.path("lng").doubleValue(), p.path("rsrp").doubleValue()));
        }
        double south = points.stream().mapToDouble(Point::lat).min().orElseThrow();
        double north = points.stream().mapToDouble(Point::lat).max().orElseThrow();
        double west = points.stream().mapToDouble(Point::lng).min().orElseThrow();
        double east = points.stream().mapToDouble(Point::lng).max().orElseThrow();
        double maxDistance = Math.min(100.0, spacing * 0.75);
        ObjectNode result = mapper.createObjectNode();
        String id = UUID.randomUUID().toString();
        result.put("id", id);
        result.put("simulationId", simulationId);
        result.put("predictionSha256", hash(simulation));
        result.put("predictionVersion", simulation.path("metadata").path("model_version").asText("no especificada"));
        result.put("createdAt", Instant.now().toString());
        result.put("quantity", QUANTITY);
        result.put("unit", "dBm");
        result.put("maxDistanceM", maxDistance);
        result.set("originalObservations", observations.deepCopy());
        ArrayNode accepted = result.putArray("accepted");
        ArrayNode rejected = result.putArray("rejected");
        Set<Integer> trainingPoints = new HashSet<>();
        List<Match> matches = new ArrayList<>();
        // Process training first so a reserve record can never share its prediction with training.
        for (String split : List.of("fit", "holdout")) {
            for (int i = 0; i < observations.size(); i++) {
                JsonNode obs = observations.get(i);
                if (!split.equals(obs.path("split").asText())) continue;
                String reason = validate(obs);
                if (reason != null) {
                    reject(rejected, i, reason);
                    continue;
                }
                double lat = obs.path("latitude").doubleValue();
                double lng = obs.path("longitude").doubleValue();
                if (lat < south || lat > north || lng < west || lng > east) {
                    reject(rejected, i, "Fuera del dominio de la malla.");
                    continue;
                }
                int nearest = -1;
                double distance = Double.POSITIVE_INFINITY;
                for (int j = 0; j < points.size(); j++) {
                    double candidate = distance(lat, lng, points.get(j).lat, points.get(j).lng);
                    if (candidate < distance) { distance = candidate; nearest = j; }
                }
                if (distance > maxDistance) {
                    reject(rejected, i, "Sin punto de predicción dentro de la distancia máxima.");
                    continue;
                }
                if (split.equals("holdout") && trainingPoints.contains(nearest)) {
                    reject(rejected, i, "La reserva comparte un punto de predicción con el ajuste.");
                    continue;
                }
                if (split.equals("fit")) trainingPoints.add(nearest);
                matches.add(new Match(i, split, nearest, distance, obs.path("value").doubleValue()));
            }
        }
        for (int i = 0; i < observations.size(); i++) {
            String split = observations.get(i).path("split").asText();
            if (!split.equals("fit") && !split.equals("holdout")) {
                reject(rejected, i, "split debe ser fit o holdout.");
            }
        }
        long fitCount = matches.stream().filter(m -> m.split.equals("fit")).count();
        long holdoutCount = matches.stream().filter(m -> m.split.equals("holdout")).count();
        if (fitCount == 0 || holdoutCount == 0) {
            StringBuilder details = new StringBuilder("Se necesita al menos un punto válido independiente en ajuste y reserva.");
            for (JsonNode item : rejected) {
                if (details.length() > 1500) break;
                details.append(" Fila ").append(item.path("observationIndex").asInt() + 1)
                        .append(": ").append(item.path("reason").asText());
            }
            throw new IllegalArgumentException(details.toString());
        }
        double offset = matches.stream().filter(m -> m.split.equals("fit"))
                .mapToDouble(m -> m.value - points.get(m.point).value).average().orElseThrow();
        result.put("offsetDb", offset);
        for (Match m : matches) {
            Point p = points.get(m.point);
            ObjectNode row = accepted.addObject();
            row.put("observationIndex", m.index);
            row.put("split", m.split);
            row.put("predictionIndex", m.point);
            row.put("predictionLatitude", p.lat);
            row.put("predictionLongitude", p.lng);
            row.put("distanceM", m.distance);
            row.put("predictionDbm", p.value);
            row.put("observationDbm", m.value);
            row.put("correctedDbm", p.value + offset);
            row.put("residualBeforeDb", p.value - m.value);
            row.put("residualAfterDb", p.value + offset - m.value);
        }
        ObjectNode metrics = result.putObject("holdoutMetrics");
        metrics.put("count", holdoutCount);
        metrics.put("biasBeforeDb", matches.stream().filter(m -> m.split.equals("holdout"))
                .mapToDouble(m -> points.get(m.point).value - m.value).average().orElseThrow());
        metrics.put("biasAfterDb", matches.stream().filter(m -> m.split.equals("holdout"))
                .mapToDouble(m -> points.get(m.point).value + offset - m.value).average().orElseThrow());
        metrics.put("rmseBeforeDb", rmse(matches, points, 0));
        metrics.put("rmseAfterDb", rmse(matches, points, offset));
        Path scenarioDirectory = directory.resolve(simulationId);
        Files.createDirectories(scenarioDirectory);
        Path temporary = Files.createTempFile(scenarioDirectory, id, ".tmp");
        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(temporary.toFile(), result);
            try {
                Files.move(temporary, scenarioDirectory.resolve(id + ".json"), StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(temporary, scenarioDirectory.resolve(id + ".json"));
            }
        } finally {
            Files.deleteIfExists(temporary);
        }
        return result;
    }

    public List<JsonNode> list(String simulationId) throws IOException {
        JsonNode simulation = simulations.getById(simulationId);
        if (!Files.isDirectory(directory)) return List.of();
        List<JsonNode> results = new ArrayList<>();
        String predictionHash = hash(simulation);
        Path scenarioDirectory = directory.resolve(simulationId);
        if (Files.isDirectory(scenarioDirectory)) {
            try (Stream<Path> files = Files.list(scenarioDirectory)) {
                for (Path file : files.filter(p -> p.getFileName().toString().endsWith(".json")).toList()) {
                    JsonNode item;
                    try {
                        item = mapper.readTree(file.toFile());
                    } catch (JsonProcessingException e) {
                        throw new IOException("Resultado de calibración ilegible del escenario consultado: "
                                + file.getFileName(), e);
                    }
                    if (!(item instanceof ObjectNode copy) || !simulationId.equalsIgnoreCase(copy.path("simulationId").asText())) {
                        throw new IOException("Resultado de calibración inválido o de otro escenario: " + file.getFileName());
                    }
                    copy.put("predictionMatches", predictionHash.equals(copy.path("predictionSha256").asText()));
                    results.add(copy);
                }
            }
        }
        // Legacy flat files cannot be attributed if they are corrupt.
        try (Stream<Path> files = Files.list(directory)) {
            for (Path file : files.filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().endsWith(".json")).toList()) {
                JsonNode item;
                try {
                    item = mapper.readTree(file.toFile());
                } catch (JsonProcessingException e) {
                    log.warn("Resultado antiguo de calibración ilegible {}: {}", file.getFileName(), e.getOriginalMessage());
                    continue;
                }
                if (!(item instanceof ObjectNode copy)) {
                    log.warn("Resultado antiguo de calibración inválido: {}", file.getFileName());
                    continue;
                }
                if (simulationId.equalsIgnoreCase(copy.path("simulationId").asText())) {
                    copy.put("predictionMatches", predictionHash.equals(copy.path("predictionSha256").asText()));
                    results.add(copy);
                }
            }
        }
        return results;
    }

    static void checkComparisonBudget(int gridSize, int observationCount) {
        if ((long) gridSize * observationCount > MAX_COMPARISONS) {
            throw new IllegalArgumentException("La importación supera el límite de 10 millones de comparaciones espaciales; reduce el número de observaciones.");
        }
    }

    private String validate(JsonNode obs) {
        if (!obs.isObject() || !number(obs, "latitude") || !number(obs, "longitude")
                || !number(obs, "value") || Math.abs(obs.path("latitude").doubleValue()) > 90
                || Math.abs(obs.path("longitude").doubleValue()) > 180
                || obs.path("value").doubleValue() < -300 || obs.path("value").doubleValue() > 100)
            return "Coordenadas o valor inválidos (dBm permitido: -300 a 100).";
        if (!List.of("real", "synthetic").contains(obs.path("provenance").asText())
                || obs.path("source").asText().isBlank()) return "Falta procedencia real/sintética o fuente.";
        try { Instant.parse(obs.path("timestamp").asText()); }
        catch (DateTimeParseException e) { return "Fecha inválida; se requiere ISO 8601 UTC."; }
        if (!"dBm".equals(obs.path("unit").asText())) return "Unidad no comparable; se requiere dBm.";
        if (!QUANTITY.equals(obs.path("quantity").asText())) return "Magnitud no comparable con el proxy del prototipo (SS-RSRP no es equivalente).";
        return null;
    }

    private static boolean number(JsonNode node, String field) {
        return node.path(field).isNumber() && Double.isFinite(node.path(field).doubleValue());
    }
    private static void reject(ArrayNode rejected, int index, String reason) {
        ObjectNode item = rejected.addObject(); item.put("observationIndex", index); item.put("reason", reason);
    }
    private static double distance(double lat1, double lon1, double lat2, double lon2) {
        double dlat = Math.toRadians(lat2 - lat1), dlon = Math.toRadians(lon2 - lon1);
        double a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dlon / 2), 2);
        return 2 * 6371000 * Math.asin(Math.sqrt(Math.min(1, a)));
    }
    private static double rmse(List<Match> matches, List<Point> points, double offset) {
        return Math.sqrt(matches.stream().filter(m -> m.split.equals("holdout"))
                .mapToDouble(m -> Math.pow(points.get(m.point).value + offset - m.value, 2)).average().orElseThrow());
    }
    private String hash(JsonNode simulation) throws IOException {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(mapper.writeValueAsBytes(simulation))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException("SHA-256 no disponible", e); }
    }
    private record Point(double lat, double lng, double value) {}
    private record Match(int index, String split, int point, double distance, double value) {}
}
