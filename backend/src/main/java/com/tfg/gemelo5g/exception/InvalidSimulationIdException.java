package com.tfg.gemelo5g.exception;

public class InvalidSimulationIdException extends RuntimeException {
    public InvalidSimulationIdException(String id) {
        super("El identificador de simulación no es un UUID válido: " + id);
    }
}
