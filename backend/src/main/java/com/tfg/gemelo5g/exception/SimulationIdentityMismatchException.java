package com.tfg.gemelo5g.exception;

public class SimulationIdentityMismatchException extends RuntimeException {
    public SimulationIdentityMismatchException(String fileId, String jsonId) {
        super("El archivo " + fileId + ".json declara el id interno " + jsonId
                + "; no se puede leer ni eliminar por identidad ambigua.");
    }
}
