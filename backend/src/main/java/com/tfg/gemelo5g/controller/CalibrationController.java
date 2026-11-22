package com.tfg.gemelo5g.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.tfg.gemelo5g.service.CalibrationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/simulations/{simulationId}/calibrations")
public class CalibrationController {
    private final CalibrationService service;

    public CalibrationController(CalibrationService service) { this.service = service; }

    @PostMapping
    public JsonNode create(@PathVariable String simulationId, @RequestBody JsonNode input) throws IOException {
        return service.create(simulationId, input);
    }

    @GetMapping
    public List<JsonNode> list(@PathVariable String simulationId) throws IOException {
        return service.list(simulationId);
    }
}
