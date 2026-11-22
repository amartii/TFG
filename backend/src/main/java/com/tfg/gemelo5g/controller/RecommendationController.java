package com.tfg.gemelo5g.controller;

import com.tfg.gemelo5g.service.RecommendationService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService service;

    public RecommendationController(RecommendationService service) {
        this.service = service;
    }

    @PostMapping
    public RecommendationService.Result recommend(@RequestBody RecommendationService.Request request) {
        return service.recommend(request);
    }
}
