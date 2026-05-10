%% GENERADOR DE ESCENARIOS DE REFERENCIA — Gemelo Digital 5G
% TFG: Diseño e Implementación de una Herramienta de Gemelo Digital
%      para la Planificación y Visualización de Cobertura en Redes 5G
%      Tácticas Desplegables
%
% Autor : Álvaro Martínez Téllez
% Tutor : Miguel Ángel Ortuño Pérez
% Curso : 2025-2026
%
% DESCRIPCIÓN:
%   Este script genera tres escenarios de referencia para el TFG, cada uno
%   representando un entorno típico de despliegue 5G:
%     1. URJC Fuenlabrada (Suburbano)
%     2. Sierra de Guadarrama (Rural)
%     3. Madrid Centro (Urbano denso)
%
%   Cada escenario se simula con el modelo de propagación disponible
%   (Longley-Rice si hay Communications Toolbox, COST-231 si no) y se
%   exporta a un fichero JSON independiente con UUID único en matlab/output/.
%
% EJECUCIÓN:
%   Ejecutar con Run o F5. El script no requiere interacción del usuario.
%
% SALIDA:
%   - 3 ficheros JSON en matlab/output/
%   - Información por consola de cada escenario generado
%   - Sin figuras (modo batch para generar datos de referencia)
%
% REQUISITOS:
%   - MATLAB R2025b o superior (probado en R2025b Update 4)
%   - Communications Toolbox (opcional) — si no está, usa COST-231 con advertencia
%   - Mapping Toolbox (para SRTM si está disponible)

%% =========================================================================
%  BLOQUE 0: LIMPIEZA E INICIALIZACIÓN
%  =========================================================================
clear; clc; close all;
fprintf('=== Generador de Escenarios de Referencia — Gemelo Digital 5G ===\n\n');

% Verificar disponibilidad de Communications Toolbox
v_comm = ver('comm');
tiene_comm_toolbox = ~isempty(v_comm);
if tiene_comm_toolbox
    fprintf('Communications Toolbox detectado → se usará Longley-Rice ITM\n');
else
    fprintf('⚠️  Communications Toolbox NO disponible → se usará COST-231 Hata\n');
    fprintf('   (ADVERTENCIA: error esperado de ±15 dB a 3.5 GHz)\n');
end
fprintf('\n');

% Configuración para ejecución batch sin visualización
mostrar_graficas = false;

%% =========================================================================
%  BLOQUE 1: DEFINICIÓN DE ESCENARIOS
%  =========================================================================
% Estructura con los parámetros de cada escenario

escenarios = struct();

% --- ESCENARIO 1: URJC Fuenlabrada (Suburbano) ---
escenarios(1).nombre     = 'URJC_Fuenlabrada_Suburbano';
escenarios(1).lat0       = 40.2897;          % Latitud campus URJC [°]
escenarios(1).lon0       = -3.8244;          % Longitud campus URJC [°]
escenarios(1).fc_Hz      = 3.5e9;            % Frecuencia: 3.5 GHz (banda n78)
escenarios(1).Ptx_dBm    = 40;               % Potencia: 40 dBm = 10 W
escenarios(1).Gtx_dBi    = 15;               % Ganancia antena Tx: 15 dBi
escenarios(1).hTx_m      = 30;               % Altura antena Tx: 30 m
escenarios(1).hRx_m      = 1.5;              % Altura antena Rx: 1.5 m (terminal)
escenarios(1).areaKm     = 3;                % Área: 3×3 km
escenarios(1).nPuntos    = 60;               % Cuadrícula: 60×60 puntos
escenarios(1).entorno    = 'suburban';       % Tipo de entorno
escenarios(1).srtm_file  = 'data/srtm_fuenlabrada.tif';

% --- ESCENARIO 2: Sierra de Guadarrama (Rural) ---
escenarios(2).nombre     = 'Sierra_Guadarrama_Rural';
escenarios(2).lat0       = 40.7862;          % Latitud sierra [°]
escenarios(2).lon0       = -3.9882;          % Longitud sierra [°]
escenarios(2).fc_Hz      = 0.7e9;            % Frecuencia: 700 MHz (banda n28)
escenarios(2).Ptx_dBm    = 43;               % Potencia: 43 dBm = 20 W
escenarios(2).Gtx_dBi    = 18;               % Ganancia antena Tx: 18 dBi
escenarios(2).hTx_m      = 40;               % Altura antena Tx: 40 m
escenarios(2).hRx_m      = 1.5;              % Altura antena Rx: 1.5 m
escenarios(2).areaKm     = 5;                % Área: 5×5 km (más amplia, rural)
escenarios(2).nPuntos    = 80;               % Cuadrícula: 80×80 puntos
escenarios(2).entorno    = 'rural';          % Tipo de entorno
escenarios(2).srtm_file  = 'data/srtm_fuenlabrada.tif';  % tile N40W004 cubre toda la zona

% --- ESCENARIO 3: Madrid Centro (Urbano denso) ---
escenarios(3).nombre     = 'Madrid_Centro_Urbano';
escenarios(3).lat0       = 40.4168;          % Latitud Puerta del Sol [°]
escenarios(3).lon0       = -3.7038;          % Longitud Puerta del Sol [°]
escenarios(3).fc_Hz      = 3.5e9;            % Frecuencia: 3.5 GHz (banda n78)
escenarios(3).Ptx_dBm    = 37;               % Potencia: 37 dBm = 5 W (menor por urbanismo)
escenarios(3).Gtx_dBi    = 15;               % Ganancia antena Tx: 15 dBi
escenarios(3).hTx_m      = 25;               % Altura antena Tx: 25 m (edificios)
escenarios(3).hRx_m      = 1.5;              % Altura antena Rx: 1.5 m
escenarios(3).areaKm     = 2;                % Área: 2×2 km (más pequeña, urbano denso)
escenarios(3).nPuntos    = 50;               % Cuadrícula: 50×50 puntos
escenarios(3).entorno    = 'urban';          % Tipo de entorno
escenarios(3).srtm_file  = 'data/srtm_fuenlabrada.tif';  % tile N40W004 cubre toda la zona

%% =========================================================================
%  BLOQUE 1b: LIMPIEZA DE LA CARPETA OUTPUT
%  =========================================================================
output_dir = fullfile(fileparts(mfilename('fullpath')), 'output');
if ~exist(output_dir, 'dir')
    mkdir(output_dir);
else
    ficheros_viejos = dir(fullfile(output_dir, '*.json'));
    if ~isempty(ficheros_viejos)
        delete(fullfile(output_dir, '*.json'));
        fprintf('Carpeta output limpiada: %d fichero(s) eliminado(s)\n\n', length(ficheros_viejos));
    end
end

%% =========================================================================
%  BLOQUE 2: SIMULACIÓN DE CADA ESCENARIO
%  =========================================================================
for idx = 1:length(escenarios)
    esc = escenarios(idx);
    
    fprintf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    fprintf('ESCENARIO %d/%d: %s\n', idx, length(escenarios), esc.nombre);
    fprintf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    fprintf('Ubicación: %.4f°N, %.4f°W\n', esc.lat0, -esc.lon0);
    fprintf('Frecuencia: %.1f GHz | Potencia: %d dBm | Ganancia: %d dBi\n', ...
        esc.fc_Hz/1e9, esc.Ptx_dBm, esc.Gtx_dBi);
    fprintf('Altura Tx: %d m | Área: %d×%d km | Grid: %d×%d puntos\n', ...
        esc.hTx_m, esc.areaKm, esc.areaKm, esc.nPuntos, esc.nPuntos);
    fprintf('Entorno: %s\n\n', esc.entorno);
    
    % --- PASO 1: Parámetros de configuración (análogo al Bloque 1 del script principal) ---
    fc_Hz       = esc.fc_Hz;
    Ptx_dBm     = esc.Ptx_dBm;
    Ptx_W       = 10^((Ptx_dBm - 30) / 10);
    Gtx_dBi     = esc.Gtx_dBi;
    Grx_dBi     = 0;
    hTx_m       = esc.hTx_m;
    hRx_m       = esc.hRx_m;
    L_cable_dB  = 2;
    EIRP_dBm    = Ptx_dBm + Gtx_dBi - L_cable_dB;
    
    lat0        = esc.lat0;
    lon0        = esc.lon0;
    areaKm      = esc.areaKm;
    nPuntos     = esc.nPuntos;
    gridSpacing_m = (areaKm * 1000) / nPuntos;
    
    fprintf('EIRP: %.1f dBm | Espaciado grid: %.0f m\n', EIRP_dBm, gridSpacing_m);
    
    % --- PASO 2: Generación de la cuadrícula (análogo al Bloque 2) ---
    deltaLat_deg = (areaKm / 2) / 111;
    deltaLon_deg = (areaKm / 2) / (111 * cosd(lat0));
    
    lats_vec = linspace(lat0 - deltaLat_deg, lat0 + deltaLat_deg, nPuntos);
    lons_vec = linspace(lon0 - deltaLon_deg, lon0 + deltaLon_deg, nPuntos);
    
    [LONS, LATS] = meshgrid(lons_vec, lats_vec);
    lats_flat = LATS(:);
    lons_flat = LONS(:);
    
    % --- PASO 3: Carga de elevación SRTM (análogo al Bloque 3) ---
    if isfile(esc.srtm_file)
        try
            [elev_data, R] = readgeoraster(esc.srtm_file);
            elev_data = double(elev_data);
            elev_data(elev_data < -100) = 0;
            elev_grid = geointerp(elev_data, R, lats_flat, lons_flat, 'linear');
            fprintf('Elevación SRTM cargada: [%.0f, %.0f] m\n', min(elev_grid), max(elev_grid));
            tiene_srtm = true;
            terrain_desc = 'SRTM_30m_local';
        catch ME
            warning('Error al cargar %s: %s', esc.srtm_file, ME.message);
            elev_grid = zeros(nPuntos^2, 1);
            tiene_srtm = false;
            terrain_desc = 'plano';
        end
    else
        fprintf('⚠️  Fichero SRTM no encontrado: %s\n', esc.srtm_file);
        elev_grid = zeros(nPuntos^2, 1);
        tiene_srtm = false;
        terrain_desc = 'plano';
    end
    
    % --- PASO 4: Modelo de propagación (análogo al Bloque 4) ---
    if tiene_comm_toolbox
        % Longley-Rice ITM
        fprintf('Calculando Longley-Rice para %d puntos... ', length(lats_flat));
        
        % Cargar terreno local si está disponible
        if tiene_srtm
            try
                tm = rfprop.TerrainModel('File', esc.srtm_file);
                sv = siteviewer('Terrain', tm);                         %#ok<NASGU>
                fprintf('(terreno 30m) ');
            catch
                try
                    sv = siteviewer('Terrain', esc.srtm_file);          %#ok<NASGU>
                    fprintf('(terreno 30m) ');
                catch
                    sv = siteviewer;                                     %#ok<NASGU>
                    terrain_desc = 'SRTM_90m_global';
                    fprintf('(terreno 90m) ');
                end
            end
        else
            sv = siteviewer;                                             %#ok<NASGU>
            terrain_desc = 'SRTM_90m_global';
        end
        
        tx = txsite('Name', esc.nombre, ...
            'Latitude',             lat0, ...
            'Longitude',            lon0, ...
            'AntennaHeight',        hTx_m, ...
            'TransmitterFrequency', fc_Hz, ...
            'TransmitterPower',     Ptx_W);
        
        pm = propagationModel('longley-rice');
        
        rx_sites = rxsite('Latitude',      lats_flat, ...
                          'Longitude',     lons_flat, ...
                          'AntennaHeight', hRx_m);
        
        Prx_dBm = sigstrength(rx_sites, tx, pm);
        Prx_dBm = Prx_dBm(:);
        modelo_usado = 'Longley-Rice';
        fprintf('✓\n');
        
    else
        % COST-231 Hata + corrección de terreno SRTM
        fprintf('Calculando COST-231 Hata... ');
        
        if tiene_srtm
            elev_tx = geointerp(elev_data, R, lat0, lon0, 'linear');
        else
            elev_tx = 0;
        end
        
        dist_km = sqrt( ((lons_flat - lon0) .* 111 .* cosd(lat0)).^2 + ...
                        ((lats_flat - lat0) .* 111).^2 );
        dist_km = max(dist_km, 0.01);
        
        fc_MHz = fc_Hz / 1e6;
        a_hRx  = (1.1*log10(fc_MHz) - 0.7)*hRx_m - (1.56*log10(fc_MHz) - 0.8);
        hTx_eff = max(hTx_m + (elev_tx - elev_grid), 5);
        fprintf('  Altura efectiva Tx: [%.1f, %.1f] m (media: %.1f m)\n', ...
            min(hTx_eff), max(hTx_eff), mean(hTx_eff));

        PL_dB = 46.3 + 33.9*log10(fc_MHz) - 13.82*log10(hTx_eff) - a_hRx ...
              + (44.9 - 6.55*log10(hTx_eff)) .* log10(dist_km) + 3;
        
        Prx_dBm = EIRP_dBm + Grx_dBi - PL_dB;
        Prx_dBm = Prx_dBm(:);
        
        if tiene_srtm
            modelo_usado = 'COST-231-Hata+SRTM';
        else
            modelo_usado = 'COST-231-Hata';
        end
        fprintf('✓\n');
    end
    
    % --- PASO 5: Cálculo del RSRP (análogo al Bloque 5) ---
    % Corrección por Resource Blocks según ancho de banda
    if fc_Hz >= 3e9  % FR1 mid-band (n78, n79): 100 MHz, SCS 30kHz → 66 RB
        NRB = 66;
    else             % FR1 low-band (n28): 10-20 MHz, SCS 15kHz → 52 RB promedio
        NRB = 52;
    end
    
    delta_RSRP_dB = 10 * log10(NRB * 12);
    RSRP_dBm = Prx_dBm - delta_RSRP_dB;
    
    % Aplicar límites físicos
    RSRP_min = -140;
    RSRP_max = -40;
    RSRP_dBm = max(min(RSRP_dBm, RSRP_max), RSRP_min);
    
    fprintf('RSRP rango: [%.1f, %.1f] dBm | Media: %.1f dBm\n', ...
        min(RSRP_dBm), max(RSRP_dBm), mean(RSRP_dBm));
    
    % --- PASO 6: Estadísticas de cobertura (análogo al Bloque 6c) ---
    fprintf('\nCobertura:\n');
    fprintf('  Excelente  (≥-80 dBm)  : %5.1f%%\n', 100*mean(RSRP_dBm >= -80));
    fprintf('  Buena      (-90:-80)   : %5.1f%%\n', 100*mean(RSRP_dBm >= -90 & RSRP_dBm < -80));
    fprintf('  Aceptable  (-100:-90)  : %5.1f%%\n', 100*mean(RSRP_dBm >= -100 & RSRP_dBm < -90));
    fprintf('  Débil      (-110:-100) : %5.1f%%\n', 100*mean(RSRP_dBm >= -110 & RSRP_dBm < -100));
    fprintf('  Sin cobert (<-110)     : %5.1f%%\n', 100*mean(RSRP_dBm < -110));
    
    % --- PASO 7: Exportación a JSON (análogo al Bloque 7) ---
    params.frecuencia_GHz   = fc_Hz / 1e9;
    params.potencia_tx_dBm  = Ptx_dBm;
    params.ganancia_tx_dBi  = Gtx_dBi;
    params.altura_tx_m      = hTx_m;
    params.altura_rx_m      = hRx_m;
    params.lat_emplazamiento = lat0;
    params.lon_emplazamiento = lon0;
    params.area_km           = areaKm;
    params.espaciado_grid_m  = gridSpacing_m;
    params.modelo_propagacion = modelo_usado;
    params.datos_elevacion    = terrain_desc;
    params.entorno            = esc.entorno;
    
    fprintf('\nExportando a JSON... ');
    fichero_json = exportar_json(esc.nombre, lats_flat, lons_flat, RSRP_dBm, params);
    fprintf('✓\n');
    fprintf('Fichero generado: %s\n\n', fichero_json);
end

%% =========================================================================
%  BLOQUE 3: RESUMEN FINAL
%  =========================================================================
fprintf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
fprintf('RESUMEN: %d escenarios generados con éxito\n', length(escenarios));
fprintf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
fprintf('\nLos ficheros JSON están disponibles en: matlab/output/\n');
fprintf('Para visualizarlos en el frontend:\n');
fprintf('  1. Copiarlos a backend/src/main/resources/data/\n');
fprintf('  2. Arrancar Spring Boot: mvn spring-boot:run\n');
fprintf('  3. Arrancar Angular: ng serve\n');
fprintf('  4. Abrir http://localhost:4200\n\n');
fprintf('Script completado. ✓\n');
