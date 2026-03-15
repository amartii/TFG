# Diario de validacion del script MATLAB

## Objetivo

Registrar la validacion del JSON generado por el script MATLAB y dejar una guia rapida para futuras ejecuciones.

## Checklist para futuras ejecuciones

1. Ejecutar `simulacion_cobertura_5g.m`.
2. Verificar que se genera un nuevo `.json` en `matlab/output`.
3. Comprobar que el objeto raiz contiene:
   - `id`
   - `name`
   - `createdAt`
   - `parameters` o `metadata`
   - `coveragePoints`
4. Comprobar que el primer elemento de `coveragePoints` contiene:
   - `lat`
   - `lng`
   - `rsrp`
5. Verificar que `coveragePoints` no esta vacio.
6. Confirmar que el numero de puntos coincide con la cuadricula esperada.
7. Si el consumidor espera `metadata`, revisar o adaptar `exportar_json.m`.

## Revalidacion de la ultima ejecucion

- JSON validado: `9218ebdd-7ed9-4efb-be96-b430d340c5e4.json`
- Campos en raiz:
  - `id`
  - `name`
  - `createdAt`
  - `metadata`
  - `parameters`
  - `coveragePoints`
- Campos del primer punto de `coveragePoints`:
  - `lat`
  - `lng`
  - `rsrp`
- Campos dentro de `metadata`:
  - `frequency_ghz`
  - `tx_power_dbm`
  - `antenna_height_m`
  - `tx_location`
  - `simulation_date`
  - `model`
  - `terrain_data`
  - `scenario_name`
- Numero de puntos exportados: `3600`

### Veredicto de esta ejecucion

La ejecucion actual es **valida** respecto al esquema solicitado:

- `lat`: OK
- `lng`: OK
- `rsrp`: OK
- `metadata`: OK

El JSON mas reciente generado por MATLAB en `matlab/output` ya cumple con el esquema esperado para validacion.
