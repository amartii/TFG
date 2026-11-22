package com.tfg.gemelo5g.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.gemelo5g.exception.TerrainCoverageException;
import com.tfg.gemelo5g.model.SimulationRequest;
import com.tfg.gemelo5g.model.TransmitterParameters;
import com.tfg.gemelo5g.service.GeoTiffElevationModel;
import com.tfg.gemelo5g.service.PropagationEngine;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@EnabledIfSystemProperty(named = "matlab.comparison", matches = "true")
class MatlabScenarioComparisonTest {
    private static final Map<String, Integer> GRID_SIZES = Map.of(
            "Sierra_Guadarrama_Rural", 80,
            "URJC_Fuenlabrada_Suburbano", 60,
            "Madrid_Centro_Urbano", 50);

    @Test
    void describeHistoricalComparisonAtIdenticalCoordinates() throws Exception {
        String input = System.getProperty("matlab.scenarios");
        String raster = System.getProperty("matlab.raster");
        assertTrue(input != null && raster != null,
                "Se requieren -Dmatlab.scenarios y -Dmatlab.raster");
        Path directory = Path.of(input);
        assertTrue(Files.isDirectory(directory), "Directorio de escenarios inexistente");
        assertTrue(Files.isRegularFile(Path.of(raster)), "Raster inexistente");
        ObjectMapper mapper = new ObjectMapper();
        Map<String, JsonNode> scenarios = new HashMap<>();
        try (Stream<Path> paths = Files.list(directory)) {
            for (Path file : paths.filter(p -> p.getFileName().toString().endsWith(".json")).toList()) {
                JsonNode scenario = mapper.readTree(file.toFile());
                String name = scenario.path("name").asText();
                if (GRID_SIZES.containsKey(name)
                        && "Longley-Rice".equals(scenario.path("metadata").path("model").asText())) {
                    assertTrue(scenarios.putIfAbsent(name, scenario) == null,
                            "Escenario duplicado: " + name);
                }
            }
        }
        assertEquals(GRID_SIZES.keySet(), scenarios.keySet(), "Se requieren los tres escenarios");
        PropagationEngine engine = new PropagationEngine(new GeoTiffElevationModel(raster));
        for (String name : GRID_SIZES.keySet().stream().sorted().toList()) {
            compare(name, scenarios.get(name), engine);
        }
    }

    private static void compare(String name, JsonNode scenario, PropagationEngine engine) {
        JsonNode p = scenario.required("parameters");
        double frequency = number(p, "frecuencia_GHz");
        TransmitterParameters tx = new TransmitterParameters(
                number(p, "lat_emplazamiento"), number(p, "lon_emplazamiento"),
                number(p, "altura_tx_m"), number(p, "potencia_tx_dBm"),
                number(p, "ganancia_tx_dBi"));
        // El generador historico usa 2 dB en la rama COST; no lo aplica a sigstrength.
        SimulationRequest request = new SimulationRequest(name, frequency, number(p, "altura_rx_m"),
                number(p, "area_km"), number(p, "espaciado_grid_m"), 2.0, List.of(tx));
        int historicRb = frequency >= 3 ? 66 : 52;
        double assumedAdjustment = tx.txGainDbi() - 2
                + 10 * Math.log10(historicRb * 12.0 / (66 * 12.0));
        JsonNode points = scenario.required("coveragePoints");
        assertTrue(points.isArray());
        int paired = 0, outside = 0, referenceClipped = 0, javaClipped = 0, javaFiltered = 0;
        double sum = 0, squares = 0, sumAdjusted = 0, squaresAdjusted = 0;
        Set<String> seen = new HashSet<>();
        for (JsonNode point : points) {
            double lat = number(point, "lat"), lon = number(point, "lng");
            double reference = number(point, "rsrp");
            assertTrue(seen.add(Double.toHexString(lat) + ":" + Double.toHexString(lon)),
                    "Coordenada duplicada en " + name);
            assertTrue(reference >= -130 && reference <= -40, "Valor exportado fuera de rango");
            double javaValue;
            try {
                javaValue = engine.calculateRsrp(request, tx, lat, lon);
            } catch (TerrainCoverageException e) {
                outside++;
                continue;
            }
            if (javaValue < -130) javaFiltered++;
            if (reference == -40) {
                referenceClipped++;
                continue;
            }
            if (javaValue == -40 || javaValue == -140) {
                javaClipped++;
                continue;
            }
            double delta = javaValue - reference;
            double adjusted = delta - assumedAdjustment;
            sum += delta;
            squares += delta * delta;
            sumAdjusted += adjusted;
            squaresAdjusted += adjusted * adjusted;
            paired++;
        }
        int expected = GRID_SIZES.get(name) * GRID_SIZES.get(name);
        assertTrue(points.size() <= expected, "La rejilla historica contiene mas puntos de los previstos");
        assertEquals(points.size(), outside + referenceClipped + javaClipped + paired);
        System.out.printf("%s | modelo=%s terreno=%s | rejilla histórica=%d exportados=%d ausentes=%d "
                        + "sin terreno Java=%d recorte MATLAB=%d recorte Java=%d emparejados=%d "
                        + "Java bajo umbral=%d (incluido en emparejados/recortes)%n",
                name, scenario.path("metadata").path("model").asText(),
                scenario.path("metadata").path("terrain_data").asText(),
                expected, points.size(), expected - points.size(), outside, referenceClipped,
                javaClipped, paired, javaFiltered);
        System.out.printf("  Balance supuesto: MATLAB tx=%.1f dBm antena predeterminada, Java EIRP=%.1f dBm; "
                        + "recurso histórico=%d*12 Java=66*12; ajuste hipotético MATLAB=%+.6f dB%n",
                tx.txPowerDbm(), tx.txPowerDbm() + tx.txGainDbi() - 2, historicRb, assumedAdjustment);
        if (paired > 0) {
            System.out.printf("  Diferencia Java-MATLAB cruda: sesgo=%+.6f RMSE=%.6f dB; "
                            + "tras ajuste hipotético: sesgo=%+.6f RMSE=%.6f dB (no valida terreno)%n",
                    sum / paired, Math.sqrt(squares / paired),
                    sumAdjusted / paired, Math.sqrt(squaresAdjusted / paired));
        } else {
            System.out.println("  Sin pares evaluables: no se calculan sesgo ni RMSE.");
        }
    }

    private static double number(JsonNode node, String key) {
        JsonNode value = node.required(key);
        assertTrue(value.isNumber() && Double.isFinite(value.doubleValue()), "Valor no numerico: " + key);
        return value.doubleValue();
    }
}
