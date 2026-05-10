%% SIMULACIÓN DE COBERTURA 5G FR1 — Escenario Táctico n28 (700 MHz)
% TFG: Diseño e Implementación de una Herramienta de Gemelo Digital
%      para la Planificación y Visualización de Cobertura en Redes 5G
%      Tácticas Desplegables
%
% Autor : Álvaro Martínez Téllez
% Tutor : Miguel Ángel Ortuño Pérez
% Curso : 2025-2026
%
% DESCRIPCIÓN:
%   Segundo escenario de simulación: nodo táctico desplegable en banda n28
%   (700 MHz FR1). A 700 MHz la propagación es ~14 dB mejor que a 3.5 GHz
%   para la misma distancia, por lo que este escenario representa un nodo
%   de área extendida adecuado para cobertura de zona táctica amplia o
%   terreno montañoso.
%
%   Diferencias respecto al escenario base (3.5 GHz / 40 dBm):
%     - Frecuencia : 700 MHz (banda n28 — 5G NR FR1 sub-1 GHz)
%     - Potencia   : 33 dBm (5W — radio táctico portátil o vehicular ligero)
%     - Antena     : 10 dBi, omnidireccional vertical, mástil a 15 m
%     - Área       : 5×5 km, espaciado 100 m (escenario de mayor alcance)
%     - Ancho de banda: 10 MHz, SCS 15 kHz (52 RBs según 3GPP TS 38.104)
%
% REQUISITOS MATLAB:
%   - MATLAB R2025b o superior (probado en R2025b Update 4)
%   - Communications Toolbox (para propagationModel y txsite/rxsite)
%   - Mapping Toolbox (opcional, para SRTM)
%
% EJECUCIÓN:
%   Ejecutar sección a sección (Ctrl+Enter) igual que el script principal.

%% =========================================================================
%  BLOQUE 0: LIMPIEZA DEL ENTORNO
%  =========================================================================
clear; clc; close all;
disp('=== Simulación 5G FR1 n28 — Escenario Táctico 700 MHz ===');

%% =========================================================================
%  BLOQUE 1: PARÁMETROS DE CONFIGURACIÓN
%  =========================================================================
% --- Estación base táctica n28 (700 MHz) ---
fc_Hz       = 700e6;        % Frecuencia central [Hz] — banda n28 (663-698 / 703-748 MHz)
Ptx_dBm     = 33;           % Potencia de transmisión [dBm] = 2 W (radio táctico ligero)
Ptx_W       = 10^((Ptx_dBm - 30) / 10);
Gtx_dBi     = 10;           % Ganancia antena Tx [dBi] (omnidireccional vertical, mástil)
Grx_dBi     = 0;            % Ganancia antena Rx [dBi] (terminal de usuario)
hTx_m       = 15;           % Altura antena Tx [m] — mástil vehicular o soporte ligero
hRx_m       = 1.5;          % Altura antena Rx [m]

L_cable_dB  = 2;            % Pérdidas de cable [dB]

EIRP_dBm    = Ptx_dBm + Gtx_dBi - L_cable_dB;
fprintf('EIRP: %.1f dBm\n', EIRP_dBm);

% --- Emplazamiento (mismo campus URJC Fuenlabrada para comparación directa) ---
lat0 = 40.2897;
lon0 = -3.8244;

% --- Cuadrícula 5×5 km con resolución 100 m (50×50 = 2500 puntos) ---
areaKm        = 5;
gridSpacing_m = 100;
nPuntos       = areaKm * 1000 / gridSpacing_m;   % 50 puntos por lado
fprintf('Cuadrícula: %dx%d = %d puntos totales\n', nPuntos, nPuntos, nPuntos^2);

deltaLat_deg = (areaKm / 2) / 111;
deltaLon_deg = (areaKm / 2) / (111 * cosd(lat0));

%% =========================================================================
%  BLOQUE 2: GENERACIÓN DE LA CUADRÍCULA DE PUNTOS RECEPTORES
%  =========================================================================
lats_vec = linspace(lat0 - deltaLat_deg, lat0 + deltaLat_deg, nPuntos);
lons_vec = linspace(lon0 - deltaLon_deg, lon0 + deltaLon_deg, nPuntos);

[LONS, LATS] = meshgrid(lons_vec, lats_vec);

lats_flat = LATS(:);
lons_flat = LONS(:);

fprintf('Rango latitud : [%.4f, %.4f]\n', min(lats_flat), max(lats_flat));
fprintf('Rango longitud: [%.4f, %.4f]\n', min(lons_flat), max(lons_flat));

%% =========================================================================
%  BLOQUE 3: CARGA DE DATOS DE ELEVACIÓN SRTM
%  =========================================================================
srtm_file = 'data/srtm_fuenlabrada.tif';

if isfile(srtm_file)
    [elev_data, R] = readgeoraster(srtm_file);
    elev_data = double(elev_data);
    elev_data(elev_data < -100) = 0;
    elev_grid = geointerp(elev_data, R, lats_flat, lons_flat, 'linear');
    fprintf('Elevación cargada. Rango: [%.0f, %.0f] m\n', min(elev_grid), max(elev_grid));
else
    warning('Fichero SRTM no encontrado. Usando terreno plano (elev=0).');
    elev_grid = zeros(nPuntos^2, 1);
end

tiene_srtm = isfile(srtm_file);

%% =========================================================================
%  BLOQUE 4: MODELO DE PROPAGACIÓN — LONGLEY-RICE (ITM) / FALLBACK
%  =========================================================================
% NOTA: A 700 MHz la ganancia de propagación vs 3.5 GHz es:
%   ΔPL_FSPL = 20*log10(3500/700) = 20*log10(5) ≈ 14 dB menos de pérdidas
%   Esto se traduce en cobertura ~2.3× mayor en distancia (d ∝ 10^(ΔPL/n))

v_comm = ver('comm');
tiene_comm_toolbox = ~isempty(v_comm);

if tiene_comm_toolbox
    fprintf('Communications Toolbox detectado → Longley-Rice ITM (700 MHz)\n');

    tx = txsite('Name', 'gNodeB_Tactico_n28', ...
        'Latitude',             lat0, ...
        'Longitude',            lon0, ...
        'AntennaHeight',        hTx_m, ...
        'TransmitterFrequency', fc_Hz, ...
        'TransmitterPower',     Ptx_W);

    pm = propagationModel('longley-rice');

    rx_sites = rxsite('Latitude',      lats_flat, ...
                      'Longitude',     lons_flat, ...
                      'AntennaHeight', hRx_m);

    fprintf('Calculando Longley-Rice para %d puntos a 700 MHz...\n', length(lats_flat));
    Prx_dBm    = sigstrength(rx_sites, tx, pm);
    Prx_dBm    = Prx_dBm(:);
    modelo_usado = 'Longley-Rice';

else
    % Okumura-Hata urbano/suburbano: válido 150–1500 MHz, incluye 700 MHz.
    % (COST-231 Hata no es válido por debajo de 1500 MHz; se usa el original.)
    fprintf('Communications Toolbox NO disponible → Okumura-Hata 700 MHz (fallback)\n');

    dist_km = sqrt( ((lons_flat - lon0) .* 111 .* cosd(lat0)).^2 + ...
                    ((lats_flat - lat0) .* 111).^2 );
    dist_km  = max(dist_km, 0.01);

    fc_MHz  = fc_Hz / 1e6;    % 700 MHz
    % Factor de corrección de altura de receptor (ciudad mediana/pequeña)
    a_hRx = (1.1*log10(fc_MHz) - 0.7)*hRx_m - (1.56*log10(fc_MHz) - 0.8);
    % Pérdida de trayecto Okumura-Hata urbana
    PL_dB = 69.55 + 26.16*log10(fc_MHz) - 13.82*log10(hTx_m) - a_hRx ...
          + (44.9 - 6.55*log10(hTx_m)) .* log10(dist_km);

    Prx_dBm    = EIRP_dBm + Grx_dBi - PL_dB;
    Prx_dBm    = Prx_dBm(:);
    modelo_usado = 'Okumura-Hata';
end

% --- FSPL teórico para referencia ---
c = 3e8;
dist_m = sqrt( ((lons_flat - lon0) .* 111000 .* cosd(lat0)).^2 + ...
               ((lats_flat - lat0) .* 111000).^2 );
dist_m = max(dist_m, 1);
FSPL_dB       = 20*log10(dist_m) + 20*log10(fc_Hz) + 20*log10(4*pi/c);
Prx_dBm_FSPL  = EIRP_dBm + Grx_dBi - FSPL_dB;

fprintf('Modelo activo  : %s\n',        modelo_usado);
fprintf('Prx rango      : [%.1f, %.1f] dBm\n', min(Prx_dBm), max(Prx_dBm));
fprintf('Prx FSPL (ref) : [%.1f, %.1f] dBm\n', min(Prx_dBm_FSPL), max(Prx_dBm_FSPL));

%% =========================================================================
%  BLOQUE 5: CÁLCULO DEL RSRP
%  =========================================================================
% Banda n28, 10 MHz de ancho de banda, SCS = 15 kHz:
%   NRB = 52 bloques de recurso (3GPP TS 38.104 Tabla 5.3.2-1)
%   N_RE_BW = 52 * 12 = 624 RE totales → delta_RSRP = 10*log10(624) ≈ 27.95 dB
%
% A mayor ancho de banda → mayor delta_RSRP → RSRP más bajo en valor absoluto,
% pero el throughput y la capacidad aumentan. La comparación n78 vs n28 muestra
% el trade-off cobertura (700 MHz, BW estrecho) vs capacidad (3.5 GHz, 100 MHz).

NRB_10MHz = 52;          % Resource Blocks para 10 MHz, SCS=15kHz (n28)
delta_RSRP_dB = 10 * log10(NRB_10MHz * 12);   % ≈ 27.95 dB

RSRP_dBm = Prx_dBm - delta_RSRP_dB;

RSRP_min = -140;
RSRP_max = -40;
RSRP_dBm = max(min(RSRP_dBm, RSRP_max), RSRP_min);

fprintf('RSRP rango: [%.1f, %.1f] dBm\n', min(RSRP_dBm), max(RSRP_dBm));

RSRP_grid = reshape(RSRP_dBm, nPuntos, nPuntos);

%% =========================================================================
%  BLOQUE 6: VISUALIZACIÓN DEL MAPA DE COBERTURA
%  =========================================================================
figure('Name', 'Mapa Cobertura RSRP 5G n28 — 700 MHz Táctico', 'NumberTitle', 'off');

subplot(1,2,1);
imagesc(lons_vec, lats_vec, RSRP_grid);
set(gca, 'YDir', 'normal');
colormap(gca, jet);
cb = colorbar;
cb.Label.String = 'RSRP [dBm]';
clim([RSRP_min RSRP_max]);
xlabel('Longitud [°]'); ylabel('Latitud [°]');
title('Mapa de Cobertura RSRP — n28 700 MHz');
hold on;
plot(lon0, lat0, 'w^', 'MarkerSize', 12, 'LineWidth', 2, 'DisplayName', 'gNodeB Táctico');
legend('Location', 'northeast');

subplot(1,2,2);
zona_cobertura = zeros(nPuntos, nPuntos);
zona_cobertura(RSRP_grid >= -80)                      = 4;
zona_cobertura(RSRP_grid >= -90 & RSRP_grid < -80)    = 3;
zona_cobertura(RSRP_grid >= -100 & RSRP_grid < -90)   = 2;
zona_cobertura(RSRP_grid >= -110 & RSRP_grid < -100)  = 1;

imagesc(lons_vec, lats_vec, zona_cobertura);
set(gca, 'YDir', 'normal');
colormap(gca, [0.8 0.8 0.8; 1 0.4 0.4; 1 0.8 0; 0.4 0.8 0.4; 0 0.6 0]);
cb2 = colorbar('Ticks', 0:4, 'TickLabels', ...
    {'Sin cobertura','Débil (<-110)','Aceptable (<-100)','Buena (<-90)','Excelente (≥-80)'});
xlabel('Longitud [°]'); ylabel('Latitud [°]');
title('Clasificación de Cobertura — n28 700 MHz');
hold on;
plot(lon0, lat0, 'k^', 'MarkerSize', 12, 'LineWidth', 2);

sgtitle(sprintf('Simulación 5G FR1 n28 | f_c=%.0f MHz | P_{tx}=%.0f dBm | h_{Tx}=%.0f m', ...
    fc_Hz/1e6, Ptx_dBm, hTx_m));

fprintf('\n--- Estadísticas de cobertura (n28 700 MHz) ---\n');
fprintf('Excelente  (≥-80 dBm) : %5.1f%%\n', 100*mean(RSRP_dBm >= -80));
fprintf('Buena      (<-90 dBm) : %5.1f%%\n', 100*mean(RSRP_dBm >= -90 & RSRP_dBm < -80));
fprintf('Aceptable  (<-100 dBm): %5.1f%%\n', 100*mean(RSRP_dBm >= -100 & RSRP_dBm < -90));
fprintf('Débil      (<-110 dBm): %5.1f%%\n', 100*mean(RSRP_dBm >= -110 & RSRP_dBm < -100));
fprintf('Sin cobertura (<-110) : %5.1f%%\n', 100*mean(RSRP_dBm < -110));
fprintf('RSRP medio            : %.1f dBm\n', mean(RSRP_dBm));

%% =========================================================================
%  BLOQUE 7: EXPORTACIÓN A JSON
%  =========================================================================
params.frecuencia_GHz    = fc_Hz / 1e9;
params.potencia_tx_dBm   = Ptx_dBm;
params.ganancia_tx_dBi   = Gtx_dBi;
params.altura_tx_m       = hTx_m;
params.altura_rx_m       = hRx_m;
params.lat_emplazamiento = lat0;
params.lon_emplazamiento = lon0;
params.area_km           = areaKm;
params.espaciado_grid_m  = gridSpacing_m;
params.modelo_propagacion = modelo_usado;
if tiene_srtm
    params.datos_elevacion = 'SRTM_30m';
else
    params.datos_elevacion = 'plano';
end

nombre_sim = sprintf('URJC_Fuenlabrada_%.0fMHz_%ddBm_tactico', fc_Hz/1e6, Ptx_dBm);

fichero_json = exportar_json(nombre_sim, lats_flat, lons_flat, RSRP_dBm, params);
fprintf('Simulación exportada a: %s\n', fichero_json);

%% =========================================================================
%  BLOQUE 8: VALIDACIÓN — COMPARACIÓN CON FSPL TEÓRICO
%  =========================================================================
c_val = 3e8;
d_ref_m   = 1000;
FSPL_ref  = 20*log10(d_ref_m) + 20*log10(fc_Hz) + 20*log10(4*pi/c_val);
Prx_ref   = EIRP_dBm + Grx_dBi - FSPL_ref;
RSRP_ref  = Prx_ref - delta_RSRP_dB;
fprintf('\n--- Validación teórica (FSPL, d=1 km, 700 MHz) ---\n');
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

% --- Comparativa teórica 700 MHz vs 3.5 GHz ---
fprintf('\n--- Comparativa 700 MHz vs 3.5 GHz (FSPL, d=1 km) ---\n');
FSPL_35 = 20*log10(d_ref_m) + 20*log10(3.5e9) + 20*log10(4*pi/c_val);
fprintf('FSPL a 700 MHz   : %.1f dB\n', FSPL_ref);
fprintf('FSPL a 3.5 GHz   : %.1f dB\n', FSPL_35);
fprintf('Ventaja 700 MHz  : %.1f dB menos de pérdidas\n', FSPL_35 - FSPL_ref);
fprintf('Mayor alcance (approx, n=3.5): ×%.1f\n', 10^((FSPL_35-FSPL_ref)/(10*3.5)));

%% =========================================================================
%  BLOQUE 9: NOTAS DE ANÁLISIS TÁCTICO
%  =========================================================================
% La banda n28 (700 MHz) es idónea para despliegues tácticos por:
%   - Mayor alcance: ~2× más que 3.5 GHz con misma potencia
%   - Mejor penetración: edificios, vegetación, orografía accidentada
%   - Menor sensibilidad al bloqueo por obstáculos (Fresnel más amplio)
%
% Contrapartida vs n78 (3.5 GHz):
%   - Menor ancho de banda disponible (≤10-20 MHz vs ≤100 MHz)
%   - Menor throughput máximo (DL ~75 Mbps vs ~900 Mbps)
%   - Antenas más voluminosas (λ=42.8 cm vs λ=8.6 cm)
%
% Para el TFG, la comparación visual n78 vs n28 en el gemelo digital
% ilustra directamente el trade-off cobertura/capacidad que el planificador
% táctico debe evaluar según el escenario operativo.
