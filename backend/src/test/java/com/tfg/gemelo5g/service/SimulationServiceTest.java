package com.tfg.gemelo5g.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
                {"id":"%s","name":"Sim A","createdAt":"2026-04-25","metadata":{"frequency_ghz":3.5}}
                """.formatted(VALID_UUID));

        List<SimulationSummaryDto> result = service.listAll();

        assertEquals(1, result.size());
        assertEquals(VALID_UUID, result.get(0).id());
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
}
