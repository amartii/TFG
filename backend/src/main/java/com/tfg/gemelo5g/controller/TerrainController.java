package com.tfg.gemelo5g.controller;

import com.tfg.gemelo5g.model.TerrainExtentDto;
import com.tfg.gemelo5g.service.GeoTiffElevationModel;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/terrain")
public class TerrainController {
    private final GeoTiffElevationModel terrain;

    public TerrainController(GeoTiffElevationModel terrain) {
        this.terrain = terrain;
    }

    @GetMapping(value = "/extent", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Consultar extensión de los datos de terreno cargados")
    public TerrainExtentDto getExtent() {
        return terrain.extent();
    }
}
