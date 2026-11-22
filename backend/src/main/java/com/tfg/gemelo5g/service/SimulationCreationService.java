package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tfg.gemelo5g.model.CoveragePointDto;
import com.tfg.gemelo5g.model.SimulationRequest;
import com.tfg.gemelo5g.model.TransmitterParameters;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SimulationCreationService {
    private static final String PROPAGATION_MODEL = "FSPL+Deygout";
    private final Path dataDir;
    private final ObjectMapper mapper;
    private final PropagationEngine propagationEngine;
    private final String terrainSource;

    public SimulationCreationService(
            @Value("${simulations.data-dir}") String dataDirPath,
            ObjectMapper mapper,
            PropagationEngine propagationEngine,
            @Value("${terrain.source:Raster local (procedencia no especificada)}") String terrainSource) {
        this.dataDir = Paths.get(dataDirPath).toAbsolutePath().normalize();
        this.mapper = mapper;
        this.propagationEngine = propagationEngine;
        this.terrainSource = terrainSource;
    }

    public JsonNode create(SimulationRequest request) throws IOException {
        JsonNode result = calculate(request);
        String id = result.path("id").asText();

        Files.createDirectories(dataDir);
        Path target = dataDir.resolve(id + ".json");
        Path temporary = Files.createTempFile(dataDir, id, ".tmp");
        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(temporary.toFile(), result);
            try {
                Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(temporary, target);
            }
        } finally {
            Files.deleteIfExists(temporary);
        }
        return result;
    }

    private JsonNode calculate(SimulationRequest request) {
        List<CoveragePointDto> coveragePoints = propagationEngine.calculateGrid(request);
        UUID id = UUID.randomUUID();
        String timestamp = Instant.now().toString();
        return buildResult(request, coveragePoints, id, timestamp);
    }

    private ObjectNode buildResult(
            SimulationRequest request,
            List<CoveragePointDto> coveragePoints,
            UUID id,
            String timestamp) {
        TransmitterParameters primary = request.transmitters().get(0);
        double eirp = primary.txPowerDbm() + primary.txGainDbi() - request.cableLossDb();
        ObjectNode root = mapper.createObjectNode();
        root.put("id", id.toString());
        root.put("name", request.name());
        root.put("createdAt", timestamp);

        ObjectNode metadata = root.putObject("metadata");
        metadata.put("frequency_ghz", request.frequencyGHz());
        metadata.put("tx_power_dbm", primary.txPowerDbm());
        metadata.put("tx_gain_dbi", primary.txGainDbi());
        metadata.put("cable_loss_db", request.cableLossDb());
        metadata.put("eirp_dbm", eirp);
        metadata.put("antenna_height_m", primary.txHeightM());
        ObjectNode txLocation = metadata.putObject("tx_location");
        txLocation.put("latitude", primary.latitude());
        txLocation.put("longitude", primary.longitude());
        metadata.put("simulation_date", timestamp);
        metadata.put("model", modelName(request));
        metadata.put("terrain_data", terrainSource);
        metadata.put("scenario_name", request.name());
        metadata.put("model_version", "1.0.0-java");

        ObjectNode parameters = root.putObject("parameters");
        parameters.put("frecuencia_GHz", request.frequencyGHz());
        parameters.put("potencia_tx_dBm", primary.txPowerDbm());
        parameters.put("ganancia_tx_dBi", primary.txGainDbi());
        parameters.put("perdidas_cable_dB", request.cableLossDb());
        parameters.put("altura_tx_m", primary.txHeightM());
        parameters.put("altura_rx_m", request.rxHeightM());
        parameters.put("lat_emplazamiento", primary.latitude());
        parameters.put("lon_emplazamiento", primary.longitude());
        parameters.put("area_km", request.areaKm());
        parameters.put("espaciado_grid_m", request.actualGridSpacingM());
        parameters.put("espaciado_grid_solicitado_m", request.gridSpacingM());
        parameters.put("modelo_propagacion", modelName(request));
        parameters.put("datos_elevacion", terrainSource);
        if (request.clutterLossDb() != null) {
            parameters.put("perdida_clutter_manual_dB", request.clutterLossDb());
        }
        ArrayNode transmitters = parameters.putArray("transmitters");
        for (TransmitterParameters transmitter : request.transmitters()) {
            ObjectNode node = transmitters.addObject();
            node.put("latitude", transmitter.latitude());
            node.put("longitude", transmitter.longitude());
            node.put("txHeightM", transmitter.txHeightM());
            node.put("txPowerDbm", transmitter.txPowerDbm());
            node.put("txGainDbi", transmitter.txGainDbi());
            if (transmitter.antennaAzimuthDeg() != null) {
                node.put("antennaAzimuthDeg", transmitter.antennaAzimuthDeg());
                node.put("antennaDowntiltDeg", transmitter.antennaDowntiltDeg());
            }
        }

        ArrayNode points = root.putArray("coveragePoints");
        for (CoveragePointDto point : coveragePoints) {
            ObjectNode node = points.addObject();
            node.put("lat", point.lat());
            node.put("lng", point.lng());
            node.put("rsrp", point.rsrp());
        }
        return root;
    }

    private static String modelName(SimulationRequest request) {
        StringBuilder name = new StringBuilder(PROPAGATION_MODEL);
        if (request.transmitters().stream().anyMatch(tx -> tx.antennaAzimuthDeg() != null)) {
            name.append("+DirectionalApprox");
        }
        if (request.clutterLossDb() != null && request.clutterLossDb() > 0) {
            name.append("+ManualClutter");
        }
        return name.toString();
    }
}
