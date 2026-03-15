function fichero_json = exportar_json(nombre, lats, lons, rsrp_dBm, params)
%EXPORTAR_JSON  Exporta los resultados de la simulación al formato JSON
%               requerido por el backend Spring Boot del Gemelo Digital.
%
% SINTAXIS:
%   fichero_json = exportar_json(nombre, lats, lons, rsrp_dBm, params)
%
% ENTRADAS:
%   nombre    - (string) Nombre descriptivo de la simulación
%   lats      - (Nx1 double) Vector de latitudes de los puntos del grid [°]
%   lons      - (Nx1 double) Vector de longitudes de los puntos del grid [°]
%   rsrp_dBm  - (Nx1 double) Vector de valores RSRP [dBm], rango [-140, -40]
%   params    - (struct) Parámetros de configuración de la simulación:
%                 .frecuencia_GHz       Frecuencia central [GHz]
%                 .potencia_tx_dBm      Potencia de transmisión [dBm]
%                 .ganancia_tx_dBi      Ganancia antena Tx [dBi]
%                 .altura_tx_m          Altura antena Tx [m]
%                 .altura_rx_m          Altura antena Rx [m]
%                 .lat_emplazamiento    Latitud del gNodeB [°]
%                 .lon_emplazamiento    Longitud del gNodeB [°]
%                 .area_km              Lado del área de simulación [km]
%                 .espaciado_grid_m     Resolución de la cuadrícula [m]
%                 .modelo_propagacion   Nombre del modelo ('Longley-Rice', etc.)
%                 .datos_elevacion      Fuente de elevación ('SRTM_30m', etc.)
%
% SALIDA:
%   fichero_json - (string) Ruta del fichero JSON generado
%
% FORMATO JSON DE SALIDA (compatible con SimulationController Spring Boot):
%   {
%     "id": "<UUID-v4>",
%     "name": "<nombre>",
%     "createdAt": "<ISO-8601>",
%     "metadata": {
%       "frequency_ghz": 3.5,
%       "tx_power_dbm": 40,
%       "antenna_height_m": 30,
%       "tx_location": { "latitude": 40.2897, "longitude": -3.8244 },
%       "simulation_date": "<ISO-8601>",
%       "model": "Longley-Rice",
%       "terrain_data": "SRTM_30m",
%       "scenario_name": "URJC_Test"
%     },
%     "parameters": {
%       "frecuencia_GHz": 3.5,
%       "potencia_tx_dBm": 40,
%       ...
%     },
%     "coveragePoints": [
%       { "lat": 40.2850, "lng": -3.8290, "rsrp": -95.3 },
%       ...
%     ]
%   }
%
% EJEMPLO DE USO:
%   params.frecuencia_GHz = 3.5;
%   params.potencia_tx_dBm = 40;
%   params.lat_emplazamiento = 40.2897;
%   params.lon_emplazamiento = -3.8244;
%   fichero = exportar_json('URJC_Test', lats, lons, rsrp, params);
%
% AUTOR: Álvaro Martínez Téllez — TFG Gemelo Digital 5G, 2025-2026

    % -----------------------------------------------------------------------
    % 1. VALIDACIÓN DE ENTRADAS
    % -----------------------------------------------------------------------
    assert(length(lats) == length(lons) && length(lats) == length(rsrp_dBm), ...
        'exportar_json: lats, lons y rsrp_dBm deben tener la misma longitud.');

    % Clamp de RSRP al rango válido [-140, -40] dBm
    rsrp_dBm = max(min(double(rsrp_dBm), -40), -140);

    % -----------------------------------------------------------------------
    % 2. GENERACIÓN DEL UUID v4
    % Usa la JVM de MATLAB (disponible en todas las instalaciones estándar)
    % -----------------------------------------------------------------------
    uuid = char(java.util.UUID.randomUUID().toString());

    % -----------------------------------------------------------------------
    % 3. MARCA DE TIEMPO ISO-8601
    % -----------------------------------------------------------------------
    ahora = datetime('now', 'TimeZone', 'UTC');
    createdAt = char(ahora, "yyyy-MM-dd'T'HH:mm:ss'Z'");

    % -----------------------------------------------------------------------
    % 4. CONSTRUCCIÓN DE LA ESTRUCTURA MATLAB → JSON
    % -----------------------------------------------------------------------
    % Estructura de parámetros legacy (se conserva por compatibilidad)
    parameters = struct();
    campos = fieldnames(params);
    for i = 1:numel(campos)
        parameters.(campos{i}) = params.(campos{i});
    end

    % Metadata normalizada para consumidores frontend/backend
    campos_metadata = {'frecuencia_GHz', 'potencia_tx_dBm', 'altura_tx_m', ...
        'lat_emplazamiento', 'lon_emplazamiento', ...
        'modelo_propagacion', 'datos_elevacion'};
    for i = 1:numel(campos_metadata)
        assert(isfield(params, campos_metadata{i}), ...
            'exportar_json: Falta el campo requerido para metadata: %s', campos_metadata{i});
    end

    metadata = struct();
    metadata.frequency_ghz   = double(params.frecuencia_GHz);
    metadata.tx_power_dbm    = double(params.potencia_tx_dBm);
    metadata.antenna_height_m = double(params.altura_tx_m);
    metadata.tx_location     = struct('latitude', double(params.lat_emplazamiento), ...
                                      'longitude', double(params.lon_emplazamiento));
    metadata.simulation_date = createdAt;
    metadata.model           = char(string(params.modelo_propagacion));
    metadata.terrain_data    = char(string(params.datos_elevacion));
    metadata.scenario_name   = char(string(nombre));

    % Array de coveragePoints — filtrar puntos con RSRP por debajo de umbral
    % (opcional: se pueden incluir todos y dejar el filtrado al frontend)
    umbral_minimo_dBm = -130;  % Excluir puntos prácticamente sin señal
    idx_validos = rsrp_dBm >= umbral_minimo_dBm;

    n_validos = sum(idx_validos);
    fprintf('  Exportando %d/%d puntos (umbral: %.0f dBm)\n', ...
        n_validos, length(rsrp_dBm), umbral_minimo_dBm);

    % Construir array de structs (jsonencode lo serializa como array JSON)
    lats_v  = lats(idx_validos);
    lons_v  = lons(idx_validos);
    rsrp_v  = rsrp_dBm(idx_validos);

    coveragePoints = struct('lat', num2cell(lats_v), ...
                            'lng', num2cell(lons_v), ...
                            'rsrp', num2cell(rsrp_v));

    % Estructura raíz del documento JSON
    sim_struct.id             = uuid;
    sim_struct.name           = nombre;
    sim_struct.createdAt      = createdAt;
    sim_struct.metadata       = metadata;
    sim_struct.parameters     = parameters;
    sim_struct.coveragePoints = coveragePoints;

    % -----------------------------------------------------------------------
    % 5. SERIALIZACIÓN A JSON
    % -----------------------------------------------------------------------
    json_str = jsonencode(sim_struct, 'PrettyPrint', true);

    % -----------------------------------------------------------------------
    % 6. ESCRITURA DEL FICHERO
    % -----------------------------------------------------------------------
    % Carpeta de salida (crear si no existe)
    output_dir = fullfile(fileparts(mfilename('fullpath')), 'output');
    if ~exist(output_dir, 'dir')
        mkdir(output_dir);
    end

    % Nombre de fichero: <uuid>.json
    fichero_json = fullfile(output_dir, [uuid, '.json']);

    fid = fopen(fichero_json, 'w', 'n', 'UTF-8');
    if fid == -1
        error('exportar_json: No se puede crear el fichero: %s', fichero_json);
    end
    fprintf(fid, '%s', json_str);
    fclose(fid);

    % -----------------------------------------------------------------------
    % 7. VERIFICACIÓN DEL FICHERO GENERADO
    % -----------------------------------------------------------------------
    info = dir(fichero_json);
    fprintf('  JSON generado: %s\n', fichero_json);
    fprintf('  Tamaño: %.1f KB | Puntos: %d | UUID: %s\n', ...
        info.bytes/1024, n_validos, uuid);

    % -----------------------------------------------------------------------
    % 8. INSTRUCCIONES DE USO CON EL BACKEND
    % -----------------------------------------------------------------------
    fprintf('\n  → Copiar el JSON a la carpeta de datos del backend:\n');
    fprintf('    src/main/resources/data/%s.json\n', uuid);
    fprintf('  → Arrancar Spring Boot y consultar:\n');
    fprintf('    GET http://localhost:8080/api/simulations\n');
    fprintf('    GET http://localhost:8080/api/simulations/%s\n', uuid);

end
