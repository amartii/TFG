package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.gemelo5g.exception.InvalidSimulationIdException;
import com.tfg.gemelo5g.exception.SimulationIdentityMismatchException;
import com.tfg.gemelo5g.exception.SimulationNotFoundException;
import com.tfg.gemelo5g.model.SimulationSummaryDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SimulationServiceTest {

    private static final String VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
    private static final ObjectMapper mapper = new ObjectMapper();

    @TempDir
    Path tempDir;

    private SimulationService service;

    @BeforeEach
    void setUp() {
        service = new SimulationService(tempDir.toString(), mapper);
    }

    // ── getById ──────────────────────────────────────────────────

    @Test
    void getById_validUuid_returnsJsonNode() throws Exception {
        Path file = tempDir.resolve(VALID_UUID + ".json");
        Files.writeString(file, """
                {"id":"%s","name":"test","metadata":{"frequency_ghz":3.5}}
                """.formatted(VALID_UUID));

        JsonNode result = service.getById(VALID_UUID);

        assertEquals(VALID_UUID, result.get("id").asText());
        assertEquals(3.5, result.get("metadata").get("frequency_ghz").asDouble());
    }

    @Test
    void getById_preservesLegacyTransmitterArrayJson() throws Exception {
        Path file = tempDir.resolve(VALID_UUID + ".json");
        Files.writeString(file, """
                {"id":"%s","parameters":{"transmitters":[
                  {"latitude":40.3,"longitude":-3.8},
                  {"latitude":40.4,"longitude":-3.9}
                ]}}
                """.formatted(VALID_UUID));

        JsonNode result = service.getById(VALID_UUID);

        assertEquals(2, result.path("parameters").path("transmitters").size());
        assertEquals(40.4, result.path("parameters").path("transmitters").get(1).path("latitude").asDouble());
    }

    @Test
    void getById_nonExistentUuid_throwsNotFound() {
        assertThrows(SimulationNotFoundException.class,
                () -> service.getById(VALID_UUID));
    }

    @Test
    void getById_invalidFormat_throwsNotFound() {
        assertThrows(SimulationNotFoundException.class,
                () -> service.getById("not-a-uuid"));
    }

    @Test
    void getById_pathTraversal_throwsNotFound() {
        assertThrows(SimulationNotFoundException.class,
                () -> service.getById("..%2F..%2Fetc%2Fpasswd"));
    }

    @Test
    void getById_directoryTraversal_throwsNotFound() {
        // Valid UUID format but with path traversal prefix
        assertThrows(SimulationNotFoundException.class,
                () -> service.getById("../550e8400-e29b-41d4-a716-446655440000"));
    }

    // ── listAll ──────────────────────────────────────────────────

    @Test
    void listAll_emptyDirectory_returnsEmptyList() throws Exception {
        List<SimulationSummaryDto> result = service.listAll();
        assertTrue(result.isEmpty());
    }

    @Test
    void listAll_withFiles_returnsSummaries() throws Exception {
        Files.writeString(tempDir.resolve(VALID_UUID + ".json"), """
                {"id":"%s","name":"Sim A","createdAt":"2026-04-25","metadata":{
                  "frequency_ghz":3.5,"tx_power_dbm":40,"antenna_height_m":30,
                  "tx_location":{"latitude":40.3,"longitude":-3.8},"model":"FSPL+Deygout"
                }}
                """.formatted(VALID_UUID));

        List<SimulationSummaryDto> result = service.listAll();

        assertEquals(1, result.size());
        assertEquals(VALID_UUID, result.get(0).id());
        assertTrue(result.get(0).valid());
        assertNull(result.get(0).error());
        assertNotNull(result.get(0).metadata());
    }

    @Test
    void listAll_ignoresNonJsonFiles() throws Exception {
        Files.writeString(tempDir.resolve("readme.txt"), "not a simulation");
        Files.writeString(tempDir.resolve(VALID_UUID + ".json"), """
                {"id":"%s","name":"Sim","metadata":{}}
                """.formatted(VALID_UUID));

        List<SimulationSummaryDto> result = service.listAll();

        assertEquals(1, result.size());
    }

    // ── getFileResource ──────────────────────────────────────────

    @Test
    void getFileResource_validUuid_returnsReadableResource() throws Exception {
        Path file = tempDir.resolve(VALID_UUID + ".json");
        Files.writeString(file, """
                {"id":"%s"}
                """.formatted(VALID_UUID));

        Resource resource = service.getFileResource(VALID_UUID);

        assertTrue(resource.exists());
        assertTrue(resource.isReadable());
    }

    @Test
    void getFileResource_nonExistent_throwsNotFound() {
        assertThrows(SimulationNotFoundException.class,
                () -> service.getFileResource(VALID_UUID));
    }

    @Test
    void getFileResource_invalidFormat_throwsNotFound() {
        assertThrows(SimulationNotFoundException.class,
                () -> service.getFileResource("hacked!"));
    }

    @Test
    void deleteById_validUuid_removesOnlyTheSimulationFile() throws Exception {
        Path file = tempDir.resolve(VALID_UUID + ".json");
        Path unrelated = tempDir.resolve("keep.txt");
        Files.writeString(file, "{\"id\":\"" + VALID_UUID + "\"}");
        Files.writeString(unrelated, "preserve");

        service.deleteById(VALID_UUID);

        assertFalse(Files.exists(file));
        assertTrue(Files.exists(unrelated));
        assertTrue(service.listAll().isEmpty());
    }

    @Test
    void deleteById_invalidId_rejectsRequest() {
        assertThrows(InvalidSimulationIdException.class,
                () -> service.deleteById("not-a-uuid"));
    }

    @Test
    void deleteById_missingFile_returnsNotFound() {
        assertThrows(SimulationNotFoundException.class,
                () -> service.deleteById(VALID_UUID));
    }

    @Test
    void deleteById_mismatchedJsonIdCannotTargetAnotherFile() throws Exception {
        String fileId = "550e8400-e29b-41d4-a716-446655440001";
        String declaredId = "550e8400-e29b-41d4-a716-446655440002";
        Path mismatchedFile = tempDir.resolve(fileId + ".json");
        Path declaredIdFile = tempDir.resolve(declaredId + ".json");
        Files.writeString(mismatchedFile, """
                {"id":"%s","name":"Mismatched","metadata":{}}
                """.formatted(declaredId));
        Files.writeString(declaredIdFile, """
                {"id":"%s","name":"Correct target","metadata":{}}
                """.formatted(declaredId));

        SimulationSummaryDto summary = service.listAll().stream()
                .filter(item -> item.id().equals(fileId))
                .findFirst()
                .orElseThrow();
        assertFalse(summary.valid());
        assertNull(summary.metadata());
        assertTrue(summary.error().contains("declara el id interno"));
        assertThrows(SimulationIdentityMismatchException.class,
                () -> service.deleteById(fileId));

        assertTrue(Files.exists(mismatchedFile));
        assertTrue(Files.exists(declaredIdFile));
        service.deleteById(declaredId);
        assertTrue(Files.exists(mismatchedFile));
        assertFalse(Files.exists(declaredIdFile));
    }

    @Test
    void listAll_marksCorruptJsonAsInvalidWithoutHidingOtherScenarios() throws Exception {
        String corruptId = "550e8400-e29b-41d4-a716-446655440003";
        Files.writeString(tempDir.resolve(corruptId + ".json"), "{\"id\":");
        Files.writeString(tempDir.resolve(VALID_UUID + ".json"), """
                {"id":"%s","name":"Usable","metadata":{
                  "frequency_ghz":3.5,"tx_power_dbm":40,"antenna_height_m":30,
                  "tx_location":{"latitude":40.3,"longitude":-3.8},"model":"FSPL+Deygout"
                }}
                """.formatted(VALID_UUID));

        List<SimulationSummaryDto> result = service.listAll();
        SimulationSummaryDto corrupt = result.stream()
                .filter(item -> item.id().equals(corruptId))
                .findFirst()
                .orElseThrow();
        SimulationSummaryDto usable = result.stream()
                .filter(item -> item.id().equals(VALID_UUID))
                .findFirst()
                .orElseThrow();

        assertFalse(corrupt.valid());
        assertNull(corrupt.name());
        assertNull(corrupt.metadata());
        assertNotNull(corrupt.error());
        assertTrue(usable.valid());
        assertEquals("Usable", usable.name());
    }
}
