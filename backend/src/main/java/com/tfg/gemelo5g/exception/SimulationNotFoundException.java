package com.tfg.gemelo5g.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class SimulationNotFoundException extends RuntimeException {

    public SimulationNotFoundException(String id) {
        super("Simulación no encontrada: " + id);
    }
}
