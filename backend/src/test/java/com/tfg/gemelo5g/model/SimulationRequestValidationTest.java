package com.tfg.gemelo5g.model;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SimulationRequestValidationTest {

    @Test
    void rejectsGridThatExceedsPointLimit() {
        SimulationRequest request = new SimulationRequest(
                "Large grid", 3.5, 1.5, 50.0, 10.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0)));

        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            assertTrue(validator.validate(request).stream()
                    .anyMatch(violation -> violation.getMessage().contains("100.000")));
        }
    }

    @Test
    void rejectsGridWhenEndpointIntervalsExceedPointLimit() {
        SimulationRequest request = new SimulationRequest(
                "Endpoint grid", 3.5, 1.5, 50.0, 158.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0)));

        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            assertTrue(factory.getValidator().validate(request).stream()
                    .anyMatch(violation -> violation.getMessage().contains("100.000")));
        }
    }

    @Test
    void validatesTransmitterCoordinatesAndSimulationParameters() {
        SimulationRequest request = new SimulationRequest(
                "Valid grid", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0)));

        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            assertTrue(factory.getValidator().validate(request).isEmpty());
        }
    }

    @Test
    void rejectsNullTransmitterEntry() {
        SimulationRequest request = new SimulationRequest(
                "Null transmitter", 3.5, 1.5, 0.1, 50.0, 2.0,
                Arrays.asList((TransmitterParameters) null));

        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            assertTrue(factory.getValidator().validate(request).stream()
                    .anyMatch(violation -> violation.getPropertyPath().toString()
                            .contains("transmitters")));
        }

    }

    @Test
    void rejectsMoreThanOneTransmitter() {
        TransmitterParameters tx = new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0);
        SimulationRequest multiple = new SimulationRequest("multiple", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(tx, tx));
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            assertTrue(validator.validate(multiple).stream()
                    .anyMatch(v -> v.getPropertyPath().toString().contains("transmitters")));
        }
    }

    @Test
    void acceptsOptionalRadioParametersWithinBoundsAndRejectsInvalidUnitsOrRanges() {
        SimulationRequest valid = new SimulationRequest(
                "Radio options", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0, 360.0, 5.0)), 40.0);
        SimulationRequest invalidClutter = new SimulationRequest(
                "Clutter range", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0)), 40.1);
        SimulationRequest incompletePattern = new SimulationRequest(
                "Incomplete pattern", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0, 0.0, null)));
        SimulationRequest invalidAzimuth = new SimulationRequest(
                "Azimuth range", 3.5, 1.5, 0.1, 50.0, 2.0,
                List.of(new TransmitterParameters(40.0, -4.0, 30.0, 40.0, 15.0, 361.0, 0.0)));

        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            assertTrue(validator.validate(valid).isEmpty());
            assertTrue(validator.validate(invalidClutter).stream()
                    .anyMatch(violation -> violation.getPropertyPath().toString().contains("clutterLossDb")));
            assertTrue(validator.validate(incompletePattern).stream()
                    .anyMatch(violation -> violation.getMessage().contains("requiere azimut")));
            assertTrue(validator.validate(invalidAzimuth).stream()
                    .anyMatch(violation -> violation.getPropertyPath().toString().contains("antennaAzimuthDeg")));
        }
    }

    @Test
    void validatesLinkProfileCoordinates() {
        LinkProfileRequest valid = new LinkProfileRequest(90.0, 180.0);
        LinkProfileRequest invalid = new LinkProfileRequest(90.1, -181.0);

        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            assertTrue(validator.validate(valid).isEmpty());
            assertTrue(validator.validate(invalid).stream()
                    .anyMatch(violation -> violation.getPropertyPath().toString().contains("receiverLatitude")));
            assertTrue(validator.validate(invalid).stream()
                    .anyMatch(violation -> violation.getPropertyPath().toString().contains("receiverLongitude")));
        }
    }
}
