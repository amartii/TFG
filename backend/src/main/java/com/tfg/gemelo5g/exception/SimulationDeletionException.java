package com.tfg.gemelo5g.exception;

public class SimulationDeletionException extends RuntimeException {
    public SimulationDeletionException(String id, Throwable cause) {
        super("No se pudo eliminar el archivo de la simulación " + id + ".json", cause);
    }
}
