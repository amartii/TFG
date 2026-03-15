%% SIMULACIÓN DE COBERTURA 5G FR1 — Gemelo Digital Táctico
% TFG: Diseño e Implementación de una Herramienta de Gemelo Digital
%      para la Planificación y Visualización de Cobertura en Redes 5G
%      Tácticas Desplegables
%
% Autor : Álvaro Martínez Téllez
% Tutor : Miguel Ángel Ortuño Pérez
% Curso : 2025-2026
%
% DESCRIPCIÓN:
%   Script de investigación e implementación paso a paso del motor de
%   simulación radioeléctrica basado en el modelo Longley-Rice (ITM).
%   Genera un mapa de cobertura RSRP en una cuadrícula sobre un área de
%   3×3 km, integrando datos de elevación SRTM a 30 m de resolución,
%   y exporta los resultados en formato JSON para el backend Spring Boot.
%
% REQUISITOS MATLAB:
%   - MATLAB R2024a o superior
%   - Communications Toolbox (para propagationModel y txsite/rxsite)
%   - Mapping Toolbox (para readgeoraster, geotiffread, mapinterp)
%   - Antenna Toolbox (para modelos de antena configurables)
%
% EJECUCIÓN:
%   Ejecutar sección a sección (Ctrl+Enter en cada sección) para ir
%   validando cada paso antes de continuar con el siguiente.
%
% REFERENCIAS:
%   [1] Longley & Rice (1968). ESSA Tech Report ERL 79-ITS 67.
%   [2] ITU-R P.1546-6 (2019). Point-to-area predictions 30 MHz–4 GHz.
%   [3] 3GPP TR 38.901 v17 (2022). Channel model 0.5–100 GHz.
%   [4] NTIA/ITS. Irregular Terrain Model (ITM/Longley-Rice), GitHub.

%% =========================================================================
%  BLOQUE 0: LIMPIEZA DEL ENTORNO
%  =========================================================================
clear; clc; close all;
disp('=== Simulación Cobertura 5G FR1 — Gemelo Digital ===');

%% =========================================================================
%  BLOQUE 1: PARÁMETROS DE CONFIGURACIÓN DE LA SIMULACIÓN
%  =========================================================================
% --- Parámetros de la estación base (gNodeB) ---
fc_Hz       = 3.5e9;        % Frecuencia central [Hz] — banda n78 (3.4-3.8 GHz FR1)
Ptx_dBm     = 40;           % Potencia de transmisión [dBm] = 10 W
Ptx_W       = 10^((Ptx_dBm - 30) / 10);  % Conversión a Watts
Gtx_dBi     = 15;           % Ganancia antena Tx [dBi] (antena sectorial típica)
Grx_dBi     = 0;            % Ganancia antena Rx [dBi] (terminal omnidireccional)
hTx_m       = 30;           % Altura antena Tx sobre el suelo [m]
hRx_m       = 1.5;          % Altura antena Rx (terminal de usuario) [m]

% Pérdidas de línea y conexión (cables, conectores, etc.)
L_cable_dB  = 2;            % Pérdidas de cable [dB]

% EIRP = Ptx + Gtx - L_cable
EIRP_dBm    = Ptx_dBm + Gtx_dBi - L_cable_dB;
fprintf('EIRP: %.1f dBm\n', EIRP_dBm);

% --- Emplazamiento de la antena Tx ---
% Coordenadas de prueba: Campus URJC Fuenlabrada (edificio Rectorado)
lat0 = 40.2897;   % Latitud  [grados decimales]
lon0 = -3.8244;   % Longitud [grados decimales]

% --- Parámetros de la cuadrícula de simulación ---
areaKm        = 3;       % Lado del área cuadrada [km]
gridSpacing_m = 50;      % Espaciado de la cuadrícula [m]
nPuntos       = areaKm * 1000 / gridSpacing_m;  % Puntos por lado = 60
fprintf('Cuadrícula: %dx%d = %d puntos totales\n', nPuntos, nPuntos, nPuntos^2);

% Conversión del área a grados (aprox: 1° lat ≈ 111 km, 1° lon ≈ 111*cos(lat) km)
deltaLat_deg = (areaKm / 2) / 111;
deltaLon_deg = (areaKm / 2) / (111 * cosd(lat0));

%% =========================================================================
%  BLOQUE 2: GENERACIÓN DE LA CUADRÍCULA DE PUNTOS RECEPTORES
%  =========================================================================
% Crear vectores de latitudes y longitudes
lats_vec = linspace(lat0 - deltaLat_deg, lat0 + deltaLat_deg, nPuntos);
lons_vec = linspace(lon0 - deltaLon_deg, lon0 + deltaLon_deg, nPuntos);

% Crear la cuadrícula 2D
[LONS, LATS] = meshgrid(lons_vec, lats_vec);

% Vectorizar para cálculo (nPuntos^2 × 1)
lats_flat = LATS(:);
lons_flat = LONS(:);

fprintf('Rango latitud: [%.4f, %.4f]\n', min(lats_flat), max(lats_flat));
fprintf('Rango longitud: [%.4f, %.4f]\n', min(lons_flat), max(lons_flat));

%% =========================================================================
%  BLOQUE 3: CARGA DE DATOS DE ELEVACIÓN SRTM
%  =========================================================================
% INSTRUCCIONES DE DESCARGA:
%   1. Ir a https://earthexplorer.usgs.gov/
%   2. Buscar por coordenadas del emplazamiento (lat0, lon0)
%   3. Seleccionar: Digital Elevation > SRTM > SRTM 1 Arc-Second Global
%   4. Descargar el tile .tif que cubre el área de simulación
%   5. Guardar en: matlab/data/srtm_<zona>.tif
%
% El tile para Fuenlabrada es: N40W004 (srtm_n40_w004.tif aprox.)

srtm_file = 'data/srtm_fuenlabrada.tif';  % ← ajustar al fichero descargado

if isfile(srtm_file)
    % --- OPCIÓN A: Cargar datos SRTM reales con Mapping Toolbox ---
    [elev_data, R] = readgeoraster(srtm_file);
    elev_data = double(elev_data);  % Convertir a double para cálculos
    elev_data(elev_data < -100) = 0;  % Reemplazar valores sin datos (ocean/nodata)

    % Interpolar elevación en los puntos de la cuadrícula
    % geointerp interpola usando la referencia geográfica R del raster
    elev_grid = geointerp(elev_data, R, lats_flat, lons_flat, 'linear');
    fprintf('Elevación cargada. Rango: [%.0f, %.0f] m\n', min(elev_grid), max(elev_grid));
else
    % --- OPCIÓN B: Terreno plano (para pruebas iniciales sin SRTM) ---
    warning('Fichero SRTM no encontrado. Usando terreno plano (elev=0).');
    elev_grid = zeros(nPuntos^2, 1);

    % TODO: Sustituir por datos SRTM reales cuando estén disponibles
    % Para terreno sintético de prueba (colina gaussiana):
    % dist_m = sqrt(((lons_flat - lon0) * 111000 * cosd(lat0)).^2 + ...
    %               ((lats_flat - lat0) * 111000).^2);
    % elev_grid = 50 * exp(-dist_m.^2 / (500^2));  % Colina de 50m, sigma=500m
end

%% =========================================================================
%  BLOQUE 4: MODELO DE PROPAGACIÓN — LONGLEY-RICE (ITM)
%  =========================================================================
% MATLAB Communications Toolbox implementa Longley-Rice a través de
% propagationModel('longley-rice') + txsite/rxsite desde R2019b.
%
% ALTERNATIVAS si no está disponible el toolbox:
%   A) Usar esta función con el modelo ITM portado a MATLAB (ver refs.)
%   B) Usar COST-231 Hata como aproximación (ver BLOQUE 4B más abajo)
%   C) Llamar a ejecutable C del NTIA vía system()

% --- Definición del sitio transmisor ---
tx = txsite('cartesian', ...  % usar 'geographic' si Communications Toolbox disponible
    'Latitude',  lat0, ...
    'Longitude', lon0, ...
    'AntennaHeight', hTx_m, ...
    'TransmitterFrequency', fc_Hz, ...
    'TransmitterPower', Ptx_W);

% --- OPCIÓN A: propagationModel de MATLAB (requiere Communications Toolbox) ---
% Descomentar si tienes Communications Toolbox con Site Designer:
%{
pm = propagationModel('longley-rice', ...
    'TimeVariabilityTolerance', 0.5, ...   % Fiabilidad del 50% (mediana)
    'LocationVariabilityTolerance', 0.5);

rx_sites = rxsite('Latitude', lats_flat, 'Longitude', lons_flat, ...
    'AntennaHeight', hRx_m);

% sigstrength devuelve la potencia recibida en dBm
Prx_dBm = sigstrength(rx_sites, tx, pm);
%}

% --- OPCIÓN B: Modelo COST-231 Hata (urbano/suburbano, 1500 MHz–2000 MHz) ---
% Nota: estrictamente válido hasta 2 GHz; usar como aproximación para 3.5 GHz
% con corrección de frecuencia adicional.
% Se usa aquí como implementación de prueba hasta tener Longley-Rice.
%{
% Distancia 3D a cada punto del grid [km]
dist_km = sqrt( ((lons_flat - lon0) .* 111 .* cosd(lat0)).^2 + ...
                ((lats_flat - lat0) .* 111).^2 );
dist_km = max(dist_km, 0.01);  % Evitar log(0), mínimo 10 m

fc_MHz = fc_Hz / 1e6;
a_hRx = (1.1 * log10(fc_MHz) - 0.7) * hRx_m - (1.56 * log10(fc_MHz) - 0.8);
PL_dB = 46.3 + 33.9*log10(fc_MHz) - 13.82*log10(hTx_m) - a_hRx ...
      + (44.9 - 6.55*log10(hTx_m)) .* log10(dist_km) + 3;  % C_m=3 dB (ciudad media)
%}

% --- OPCIÓN C: Free Space Path Loss (FSPL) — baseline teórico ---
% Útil para validar que los resultados son coherentes con el límite superior
dist_m = sqrt( ((lons_flat - lon0) .* 111000 .* cosd(lat0)).^2 + ...
               ((lats_flat - lat0) .* 111000).^2 );
dist_m = max(dist_m, 1);  % mínimo 1 m

% FSPL(d,f) = 20*log10(d) + 20*log10(f) + 20*log10(4*pi/c)
c = 3e8;
FSPL_dB = 20*log10(dist_m) + 20*log10(fc_Hz) + 20*log10(4*pi/c);

% Potencia recibida con FSPL [dBm]
Prx_dBm_FSPL = EIRP_dBm + Grx_dBi - FSPL_dB;

% Usar FSPL como valor de Prx_dBm de trabajo hasta tener Longley-Rice
Prx_dBm = Prx_dBm_FSPL;

fprintf('Prx rango (FSPL): [%.1f, %.1f] dBm\n', min(Prx_dBm), max(Prx_dBm));

%% =========================================================================
%  BLOQUE 5: CÁLCULO DEL RSRP (Reference Signal Received Power)
%  =========================================================================
% En 5G NR, el RSRP se mide sobre los Resource Elements (RE) de los
% Reference Signals (SSB/CSI-RS), no sobre todo el ancho de banda.
%
% RSRP = Prx_total - 10*log10(N_RE_BW)
%
% Para 5G NR FR1, banda n78 (100 MHz, SCS=30 kHz):
%   - N_RB = 66 bloques de recurso en 100 MHz con SCS=30kHz (3GPP TS 38.104)
%   - N_RE_per_RB = 12 subportadoras
%   - N_RE_BW = 66 * 12 = 792 RE totales de datos
%   - Los RE de SSB ocupan 240 subportadoras (20 RB × 12)
%   - Corrección aproximada: -10*log10(N_RB) ≈ -18 dB

NRB_100MHz = 66;           % Resource Blocks para 100 MHz, SCS=30kHz (n78)
delta_RSRP_dB = 10 * log10(NRB_100MHz * 12);  % ≈ 19.8 dB

RSRP_dBm = Prx_dBm - delta_RSRP_dB;

% Aplicar límites físicos válidos
RSRP_min = -140;  % dBm (umbral mínimo medible)
RSRP_max = -40;   % dBm (señal excelente cerca de la antena)
RSRP_dBm = max(min(RSRP_dBm, RSRP_max), RSRP_min);

fprintf('RSRP rango: [%.1f, %.1f] dBm\n', min(RSRP_dBm), max(RSRP_dBm));

% Reconstruir en forma matricial para visualización
RSRP_grid = reshape(RSRP_dBm, nPuntos, nPuntos);

%% =========================================================================
%  BLOQUE 6: VISUALIZACIÓN DEL MAPA DE COBERTURA
%  =========================================================================
figure('Name', 'Mapa de Cobertura RSRP 5G FR1', 'NumberTitle', 'off');

% --- 6a. Heatmap 2D del RSRP ---
subplot(1,2,1);
imagesc(lons_vec, lats_vec, RSRP_grid);
set(gca, 'YDir', 'normal');
colormap(gca, jet);
cb = colorbar;
cb.Label.String = 'RSRP [dBm]';
caxis([RSRP_min RSRP_max]);
xlabel('Longitud [°]'); ylabel('Latitud [°]');
title('Mapa de Cobertura RSRP');
hold on;
plot(lon0, lat0, 'w^', 'MarkerSize', 12, 'LineWidth', 2, 'DisplayName', 'gNodeB');
legend('Location', 'northeast');

% --- 6b. Zonas de cobertura por calidad ---
subplot(1,2,2);
% Clasificación según umbrales típicos 5G
zona_cobertura = zeros(nPuntos, nPuntos);
zona_cobertura(RSRP_grid >= -80)                      = 4;  % Excelente
zona_cobertura(RSRP_grid >= -90 & RSRP_grid < -80)    = 3;  % Buena
zona_cobertura(RSRP_grid >= -100 & RSRP_grid < -90)   = 2;  % Aceptable
zona_cobertura(RSRP_grid >= -110 & RSRP_grid < -100)  = 1;  % Débil
% zona = 0: sin cobertura (<-110 dBm)

imagesc(lons_vec, lats_vec, zona_cobertura);
set(gca, 'YDir', 'normal');
colormap(gca, [0.8 0.8 0.8; 1 0.4 0.4; 1 0.8 0; 0.4 0.8 0.4; 0 0.6 0]);
cb2 = colorbar('Ticks', 0:4, 'TickLabels', ...
    {'Sin cobertura','Débil (<-110)','Aceptable (<-100)','Buena (<-90)','Excelente (≥-80)'});
xlabel('Longitud [°]'); ylabel('Latitud [°]');
title('Clasificación de Cobertura');
hold on;
plot(lon0, lat0, 'k^', 'MarkerSize', 12, 'LineWidth', 2);

sgtitle(sprintf('Simulación 5G FR1 | f_c=%.1f GHz | P_{tx}=%.0f dBm | h_{Tx}=%.0f m', ...
    fc_Hz/1e9, Ptx_dBm, hTx_m));

% --- 6c. Estadísticas de cobertura ---
fprintf('\n--- Estadísticas de cobertura ---\n');
fprintf('Excelente  (≥-80 dBm) : %5.1f%%\n', 100*mean(RSRP_dBm >= -80));
fprintf('Buena      (<-90 dBm) : %5.1f%%\n', 100*mean(RSRP_dBm >= -90 & RSRP_dBm < -80));
fprintf('Aceptable  (<-100 dBm): %5.1f%%\n', 100*mean(RSRP_dBm >= -100 & RSRP_dBm < -90));
fprintf('Débil      (<-110 dBm): %5.1f%%\n', 100*mean(RSRP_dBm >= -110 & RSRP_dBm < -100));
fprintf('Sin cobertura (<-110) : %5.1f%%\n', 100*mean(RSRP_dBm < -110));
fprintf('RSRP medio            : %.1f dBm\n', mean(RSRP_dBm));

%% =========================================================================
%  BLOQUE 7: EXPORTACIÓN A JSON (llamada a exportar_json.m)
%  =========================================================================
% Construir estructura de parámetros de la simulación
params.frecuencia_GHz   = fc_Hz / 1e9;
params.potencia_tx_dBm  = Ptx_dBm;
params.ganancia_tx_dBi  = Gtx_dBi;
params.altura_tx_m      = hTx_m;
params.altura_rx_m      = hRx_m;
params.lat_emplazamiento = lat0;
params.lon_emplazamiento = lon0;
params.area_km           = areaKm;
params.espaciado_grid_m  = gridSpacing_m;
params.modelo_propagacion = 'FSPL';  % Cambiar a 'Longley-Rice' cuando se implemente
params.datos_elevacion    = 'plano'; % Cambiar a 'SRTM_30m' cuando se cargue el .tif

% Nombre descriptivo de la simulación
nombre_sim = sprintf('URJC_Fuenlabrada_%.1fGHz_%ddBm', fc_Hz/1e9, Ptx_dBm);

% Llamar a la función de exportación (ver exportar_json.m)
fichero_json = exportar_json(nombre_sim, lats_flat, lons_flat, RSRP_dBm, params);
fprintf('Simulación exportada a: %s\n', fichero_json);

%% =========================================================================
%  BLOQUE 8: VALIDACIÓN — COMPARACIÓN CON FSPL TEÓRICO
%  =========================================================================
% Comprobación de coherencia: a 1 km de distancia en espacio libre:
d_ref_m   = 1000;
FSPL_ref  = 20*log10(d_ref_m) + 20*log10(fc_Hz) + 20*log10(4*pi/c);
Prx_ref   = EIRP_dBm + Grx_dBi - FSPL_ref;
RSRP_ref  = Prx_ref - delta_RSRP_dB;
fprintf('\n--- Validación teórica (FSPL, d=1 km) ---\n');
fprintf('FSPL             : %.1f dB\n', FSPL_ref);
fprintf('Prx              : %.1f dBm\n', Prx_ref);
fprintf('RSRP estimado    : %.1f dBm\n', RSRP_ref);
fprintf('Interpretación   : ');
if     RSRP_ref >= -80,  fprintf('Excelente\n');
elseif RSRP_ref >= -90,  fprintf('Buena\n');
elseif RSRP_ref >= -100, fprintf('Aceptable\n');
elseif RSRP_ref >= -110, fprintf('Débil\n');
else,                    fprintf('Sin cobertura\n');
end

%% =========================================================================
%  BLOQUE 9: PRÓXIMOS PASOS (TODO)
%  =========================================================================
% [ ] Sustituir FSPL por modelo Longley-Rice real:
%       - Opción A: propagationModel('longley-rice') de Communications Toolbox
%       - Opción B: portar ITM C-code de NTIA a MATLAB via mex o system()
%       - Opción C: usar la función longleyRice.m de referencia (ver docs/papers/)
%
% [ ] Cargar datos SRTM reales (descargar tile N40W004 de USGS EarthExplorer)
%
% [ ] Añadir modelo de antena sectorial real con patrón 3D (Antenna Toolbox)
%
% [ ] Validar con mediciones reales de RSRP en campus URJC
%
% [ ] Integrar pérdidas adicionales: vegetación, difracción sobre colinas
%
% [ ] Prueba de escenario rural montañoso (Anexo E del TFG)
