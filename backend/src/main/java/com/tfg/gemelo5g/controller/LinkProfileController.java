package com.tfg.gemelo5g.controller;

import com.tfg.gemelo5g.model.LinkProfileDto;
import com.tfg.gemelo5g.model.LinkProfileRequest;
import com.tfg.gemelo5g.service.LinkProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/simulations/{simulationId}/link-profile")
public class LinkProfileController {
    private final LinkProfileService service;

    public LinkProfileController(LinkProfileService service) {
        this.service = service;
    }

    @PostMapping
    public LinkProfileDto calculate(
            @PathVariable String simulationId,
            @Valid @RequestBody LinkProfileRequest request) throws IOException {
        return service.calculate(simulationId, request.receiverLatitude(), request.receiverLongitude());
    }
}
