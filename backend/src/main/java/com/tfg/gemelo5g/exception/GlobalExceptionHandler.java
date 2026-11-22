package com.tfg.gemelo5g.exception;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleInvalidArgument(IllegalArgumentException ex) {
        return Map.of("error", "Datos inválidos", "detail", ex.getMessage());
    }

    @ExceptionHandler(InvalidSimulationIdException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleInvalidSimulationId(InvalidSimulationIdException ex) {
        return Map.of("error", "Identificador de simulación inválido",
                      "detail", ex.getMessage());
    }

    @ExceptionHandler(SimulationNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> handleNotFound(SimulationNotFoundException ex) {
        return Map.of("error", "Simulación no encontrada",
                      "detail", ex.getMessage());
    }

    @ExceptionHandler(SimulationIdentityMismatchException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleIdentityMismatch(SimulationIdentityMismatchException ex) {
        return Map.of("error", "Identidad de simulación inconsistente",
                      "detail", ex.getMessage());
    }

    @ExceptionHandler(SimulationDeletionException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, String> handleDeletionFailure(SimulationDeletionException ex) {
        return Map.of("error", "No se pudo eliminar la simulación",
                      "detail", ex.getMessage());
    }

    @ExceptionHandler(IOException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, String> handleIoException(IOException ex) {
        return Map.of("error", "Error leyendo datos de simulación",
                      "detail", ex.getMessage());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleConstraintViolation(ConstraintViolationException ex) {
        String detail = ex.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getMessage())
                .orElse("Parámetros de consulta inválidos");

        return Map.of("error", "Parámetros de consulta inválidos",
                      "detail", detail);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElseGet(() -> ex.getBindingResult().getGlobalErrors().stream()
                        .findFirst()
                        .map(error -> error.getDefaultMessage())
                        .orElse("Parámetros de entrada inválidos"));

        return Map.of("error", "Parámetros de entrada inválidos",
                      "detail", detail);
    }

    @ExceptionHandler(TerrainCoverageException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public Map<String, String> handleTerrainCoverage(TerrainCoverageException ex) {
        return Map.of("error", "Terreno fuera de cobertura",
                      "detail", ex.getMessage());
    }

    @ExceptionHandler(TerrainDataUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public Map<String, String> handleTerrainUnavailable(TerrainDataUnavailableException ex) {
        return Map.of("error", "Datos de terreno no disponibles",
                      "detail", ex.getMessage());
    }
}
