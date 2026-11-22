package com.tfg.gemelo5g.exception;

public class TerrainDataUnavailableException extends RuntimeException {
    public TerrainDataUnavailableException(String message) {
        super(message);
    }

    public TerrainDataUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
