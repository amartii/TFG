%% COMPARATIVA DE MODELOS DE PROPAGACIÓN — Gemelo Digital 5G
% TFG: Diseño e Implementación de una Herramienta de Gemelo Digital
%      para la Planificación y Visualización de Cobertura en Redes 5G
%      Tácticas Desplegables
%
% Autor : Álvaro Martínez Téllez
% Tutor : Miguel Ángel Ortuño Pérez
% Curso : 2025-2026
%
% DESCRIPCIÓN:
%   Este script genera una figura comparativa de modelos de propagación para
%   la memoria del TFG. Simula el mismo escenario (URJC Fuenlabrada) con dos
%   modelos diferentes:
%     - FSPL (Free Space Path Loss) — cota superior teórica
%     - Longley-Rice ITM (si hay Communications Toolbox) — modelo objetivo
%     - COST-231 Hata (fallback si no hay toolbox) — modelo empírico
%
%   La figura resultante incluye:
%     1. Heatmap RSRP del modelo A (FSPL)
%     2. Heatmap RSRP del modelo B (Longley-Rice o COST-231)
%     3. Mapa de diferencias ΔRSRP = A - B (divergente colormap)
%     4. Métricas estadísticas por consola: RMSE, MAE, Media, Max/Min ΔRSRP
%
% SALIDA:
%   - Figura PNG guardada en: TFG GD5G/figs/comparativa_modelos.png (DPI 300)
%   - Métricas estadísticas impresas en consola
%
% REQUISITOS:
%   - MATLAB R2025b o superior (probado en R2025b Update 4)
%   - Communications Toolbox (opcional) — si no está, compara FSPL vs COST-231
%   - Mapping Toolbox (para SRTM si está disponible)

%% =========================================================================
%  BLOQUE 0: LIMPIEZA E INICIALIZACIÓN
%  =========================================================================
clear; clc; close all;
fprintf('=== Comparativa de Modelos de Propagación — Gemelo Digital 5G ===\n\n');

% Verificar disponibilidad de Communications Toolbox
v_comm = ver('comm');
tiene_comm_toolbox = ~isempty(v_comm);

if tiene_comm_toolbox
    fprintf('Communications Toolbox detectado\n');
    fprintf('Comparación: FSPL vs Longley-Rice ITM\n\n');
    modelo_B_nombre = 'Longley-Rice';
else
    fprintf('⚠️  Communications Toolbox NO disponible\n');
    fprintf('Comparación: FSPL vs COST-231 Hata\n');
    fprintf('(ADVERTENCIA: COST-231 tiene error de ±15 dB a 3.5 GHz)\n\n');
    modelo_B_nombre = 'COST-231 Hata';
end

%% =========================================================================
%  BLOQUE 1: PARÁMETROS DEL ESCENARIO (URJC Fuenlabrada)
%  =========================================================================
% Usamos los mismos parámetros que el Escenario 1 de generar_escenarios.m

fc_Hz       = 3.5e9;        % Frecuencia: 3.5 GHz (banda n78)
Ptx_dBm     = 40;           % Potencia: 40 dBm = 10 W
Ptx_W       = 10^((Ptx_dBm - 30) / 10);
Gtx_dBi     = 15;           % Ganancia antena Tx: 15 dBi
Grx_dBi     = 0;            % Ganancia antena Rx: 0 dBi (omnidireccional)
hTx_m       = 30;           % Altura antena Tx: 30 m
hRx_m       = 1.5;          % Altura antena Rx: 1.5 m
L_cable_dB  = 2;            % Pérdidas de cable: 2 dB
EIRP_dBm    = Ptx_dBm + Gtx_dBi - L_cable_dB;

lat0        = 40.2897;      % Latitud campus URJC [°]
lon0        = -3.8244;      % Longitud campus URJC [°]
areaKm      = 3;            % Área: 3×3 km
nPuntos     = 60;           % Cuadrícula: 60×60 puntos
gridSpacing_m = (areaKm * 1000) / nPuntos;

fprintf('Escenario: URJC Fuenlabrada (Suburbano)\n');
fprintf('Ubicación: %.4f°N, %.4f°W\n', lat0, -lon0);
fprintf('Frecuencia: %.1f GHz | EIRP: %.1f dBm | Altura Tx: %d m\n', ...
    fc_Hz/1e9, EIRP_dBm, hTx_m);
fprintf('Área: %d×%d km | Grid: %d×%d puntos (espaciado: %.0f m)\n\n', ...
    areaKm, areaKm, nPuntos, nPuntos, gridSpacing_m);

%% =========================================================================
%  BLOQUE 2: GENERACIÓN DE LA CUADRÍCULA
%  =========================================================================
deltaLat_deg = (areaKm / 2) / 111;
deltaLon_deg = (areaKm / 2) / (111 * cosd(lat0));

lats_vec = linspace(lat0 - deltaLat_deg, lat0 + deltaLat_deg, nPuntos);
lons_vec = linspace(lon0 - deltaLon_deg, lon0 + deltaLon_deg, nPuntos);

[LONS, LATS] = meshgrid(lons_vec, lats_vec);
lats_flat = LATS(:);
lons_flat = LONS(:);

%% =========================================================================
%  BLOQUE 3: CARGA DE DATOS DE ELEVACIÓN SRTM
%  =========================================================================
srtm_file = 'data/srtm_fuenlabrada.tif';

if isfile(srtm_file)
    try
        [elev_data, R] = readgeoraster(srtm_file);
        elev_data = double(elev_data);
        elev_data(elev_data < -100) = 0;
        elev_grid = geointerp(elev_data, R, lats_flat, lons_flat, 'linear');
        fprintf('Elevación SRTM cargada: [%.0f, %.0f] m\n', min(elev_grid), max(elev_grid));
        tiene_srtm = true;
    catch ME
        warning('Error al cargar SRTM: %s. Usando terreno plano.', ME.message);
        elev_grid = zeros(nPuntos^2, 1);
        tiene_srtm = false;
    end
else
    fprintf('⚠️  Fichero SRTM no encontrado. Usando terreno plano.\n');
    elev_grid = zeros(nPuntos^2, 1);
    tiene_srtm = false;
end

%% =========================================================================
%  BLOQUE 4: MODELO A — FSPL (Free Space Path Loss)
%  =========================================================================
fprintf('\nCalculando FSPL... ');

c       = 3e8;  % Velocidad de la luz [m/s]
dist_m  = sqrt( ((lons_flat - lon0) .* 111000 .* cosd(lat0)).^2 + ...
                ((lats_flat - lat0) .* 111000).^2 );
dist_m  = max(dist_m, 1);  % Evitar división por cero

FSPL_dB       = 20*log10(dist_m) + 20*log10(fc_Hz) + 20*log10(4*pi/c);
Prx_dBm_FSPL  = EIRP_dBm + Grx_dBi - FSPL_dB;

% Conversión a RSRP (66 RB para 100 MHz, SCS 30kHz, banda n78)
NRB_100MHz = 66;
delta_RSRP_dB = 10 * log10(NRB_100MHz * 12);
RSRP_FSPL = Prx_dBm_FSPL - delta_RSRP_dB;

% Clamp a rango válido
RSRP_min = -140;
RSRP_max = -40;
RSRP_FSPL = max(min(RSRP_FSPL, RSRP_max), RSRP_min);

fprintf('✓ Rango: [%.1f, %.1f] dBm | Media: %.1f dBm\n', ...
    min(RSRP_FSPL), max(RSRP_FSPL), mean(RSRP_FSPL));

%% =========================================================================
%  BLOQUE 5: MODELO B — Longley-Rice o COST-231 Hata
%  =========================================================================
if tiene_comm_toolbox
    % -----------------------------------------------------------------
    % MODELO B: Longley-Rice ITM (Communications Toolbox)
    % -----------------------------------------------------------------
    fprintf('Calculando Longley-Rice... ');
    
    % Cargar terreno local si está disponible
    if tiene_srtm
        try
            tm = rfprop.TerrainModel('File', srtm_file);
            sv = siteviewer('Terrain', tm);                         %#ok<NASGU>
            fprintf('(terreno 30m) ');
        catch
            try
                sv = siteviewer('Terrain', srtm_file);              %#ok<NASGU>
                fprintf('(terreno 30m) ');
            catch
                sv = siteviewer;                                     %#ok<NASGU>
                fprintf('(terreno 90m) ');
            end
        end
    else
        sv = siteviewer;                                             %#ok<NASGU>
        fprintf('(terreno 90m) ');
    end
    
    tx = txsite('Name', 'gNodeB_URJC', ...
        'Latitude',             lat0, ...
        'Longitude',            lon0, ...
        'AntennaHeight',        hTx_m, ...
        'TransmitterFrequency', fc_Hz, ...
        'TransmitterPower',     Ptx_W);
    
    pm = propagationModel('longley-rice');
    
    rx_sites = rxsite('Latitude',      lats_flat, ...
                      'Longitude',     lons_flat, ...
                      'AntennaHeight', hRx_m);
    
    Prx_dBm_B = sigstrength(rx_sites, tx, pm);
    Prx_dBm_B = Prx_dBm_B(:);
    
    RSRP_B = Prx_dBm_B - delta_RSRP_dB;
    RSRP_B = max(min(RSRP_B, RSRP_max), RSRP_min);
    
    fprintf('✓ Rango: [%.1f, %.1f] dBm | Media: %.1f dBm\n', ...
        min(RSRP_B), max(RSRP_B), mean(RSRP_B));
    
else
    % -----------------------------------------------------------------
    % MODELO B: COST-231 Hata (fallback sin toolbox)
    % -----------------------------------------------------------------
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
    
    PL_dB = 46.3 + 33.9*log10(fc_MHz) - 13.82*log10(hTx_eff) - a_hRx ...
          + (44.9 - 6.55*log10(hTx_eff)) .* log10(dist_km) + 3;
    
    Prx_dBm_B = EIRP_dBm + Grx_dBi - PL_dB;
    Prx_dBm_B = Prx_dBm_B(:);
    
    RSRP_B = Prx_dBm_B - delta_RSRP_dB;
    RSRP_B = max(min(RSRP_B, RSRP_max), RSRP_min);
    
    fprintf('✓ Rango: [%.1f, %.1f] dBm | Media: %.1f dBm\n', ...
        min(RSRP_B), max(RSRP_B), mean(RSRP_B));
end

%% =========================================================================
%  BLOQUE 6: CÁLCULO DE MÉTRICAS ESTADÍSTICAS
%  =========================================================================
% Diferencia: ΔRSRP = FSPL - Modelo_B
Delta_RSRP = RSRP_FSPL - RSRP_B;

% Métricas
RMSE  = sqrt(mean(Delta_RSRP.^2));
MAE   = mean(abs(Delta_RSRP));
Media = mean(Delta_RSRP);
Max_Delta = max(Delta_RSRP);
Min_Delta = min(Delta_RSRP);

fprintf('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
fprintf('MÉTRICAS ESTADÍSTICAS — FSPL vs %s\n', modelo_B_nombre);
fprintf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
fprintf('RMSE              : %.2f dB\n', RMSE);
fprintf('MAE               : %.2f dB\n', MAE);
fprintf('Media ΔRSRP       : %.2f dB\n', Media);
fprintf('Max ΔRSRP         : %.2f dB\n', Max_Delta);
fprintf('Min ΔRSRP         : %.2f dB\n', Min_Delta);
fprintf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

%% =========================================================================
%  BLOQUE 7: GENERACIÓN DE LA FIGURA COMPARATIVA
%  =========================================================================
fprintf('\nGenerando figura comparativa...\n');

% Reconstruir grids 2D para visualización
RSRP_FSPL_grid = reshape(RSRP_FSPL, nPuntos, nPuntos);
RSRP_B_grid    = reshape(RSRP_B, nPuntos, nPuntos);
Delta_RSRP_grid = reshape(Delta_RSRP, nPuntos, nPuntos);

% Crear figura con 3 subplots
fig = figure('Name', 'Comparativa Modelos Propagación', ...
             'NumberTitle', 'off', ...
             'Position', [100 100 1400 900]);

% --- Subplot 1: FSPL ---
subplot(2,2,1);
imagesc(lons_vec, lats_vec, RSRP_FSPL_grid);
set(gca, 'YDir', 'normal');
colormap(gca, jet);
cb1 = colorbar;
cb1.Label.String = 'RSRP [dBm]';
clim([RSRP_min RSRP_max]);
xlabel('Longitud [°]');
ylabel('Latitud [°]');
title('FSPL (Free Space Path Loss)', 'FontWeight', 'bold', 'FontSize', 12);
hold on;
plot(lon0, lat0, 'w^', 'MarkerSize', 12, 'LineWidth', 2, ...
    'MarkerFaceColor', 'white', 'MarkerEdgeColor', 'black');
grid on;
hold off;

% --- Subplot 2: Longley-Rice o COST-231 ---
subplot(2,2,2);
imagesc(lons_vec, lats_vec, RSRP_B_grid);
set(gca, 'YDir', 'normal');
colormap(gca, jet);
cb2 = colorbar;
cb2.Label.String = 'RSRP [dBm]';
clim([RSRP_min RSRP_max]);
xlabel('Longitud [°]');
ylabel('Latitud [°]');
title(modelo_B_nombre, 'FontWeight', 'bold', 'FontSize', 12);
hold on;
plot(lon0, lat0, 'w^', 'MarkerSize', 12, 'LineWidth', 2, ...
    'MarkerFaceColor', 'white', 'MarkerEdgeColor', 'black');
grid on;
hold off;

% --- Subplot 3: Mapa de diferencias (bottom, span 2 columns) ---
subplot(2,2,[3,4]);
imagesc(lons_vec, lats_vec, Delta_RSRP_grid);
set(gca, 'YDir', 'normal');

% Colormap divergente: azul (negativo) - blanco (cero) - rojo (positivo)
% MATLAB tiene colormaps divergentes built-in desde R2023b: redblue, coolwarm
% Si no está disponible, usamos un custom simple
try
    colormap(gca, flipud(redblue));  % MATLAB R2023b+
catch
    % Fallback: crear colormap divergente manual
    n_colors = 256;
    blue_to_white = [linspace(0,1,n_colors/2)', linspace(0,1,n_colors/2)', ones(n_colors/2,1)];
    white_to_red  = [ones(n_colors/2,1), linspace(1,0,n_colors/2)', linspace(1,0,n_colors/2)'];
    divergent_cmap = [blue_to_white; white_to_red];
    colormap(gca, divergent_cmap);
end

cb3 = colorbar;
cb3.Label.String = 'ΔRSRP [dB]';
% Escala simétrica centrada en 0
max_abs_delta = max(abs([Min_Delta, Max_Delta]));
clim([-max_abs_delta, max_abs_delta]);
xlabel('Longitud [°]');
ylabel('Latitud [°]');
title(sprintf('Diferencia: FSPL - %s', modelo_B_nombre), ...
    'FontWeight', 'bold', 'FontSize', 12);
hold on;
plot(lon0, lat0, 'k^', 'MarkerSize', 12, 'LineWidth', 2, ...
    'MarkerFaceColor', 'black', 'MarkerEdgeColor', 'white');
grid on;
hold off;

% Añadir anotación de texto con métricas en el subplot de diferencias
text_x = lons_vec(1) + 0.02 * (lons_vec(end) - lons_vec(1));
text_y = lats_vec(1) + 0.08 * (lats_vec(end) - lats_vec(1));
text(text_x, text_y, sprintf('RMSE: %.2f dB\nMAE: %.2f dB\nMedia: %.2f dB', ...
    RMSE, MAE, Media), ...
    'FontSize', 10, 'FontWeight', 'bold', ...
    'BackgroundColor', 'white', 'EdgeColor', 'black', 'LineWidth', 1);

% Título global de la figura
sgtitle(sprintf('Comparativa de Modelos — URJC Fuenlabrada | f_c=%.1f GHz | P_{tx}=%d dBm | h_{Tx}=%d m', ...
    fc_Hz/1e9, Ptx_dBm, hTx_m), ...
    'FontSize', 14, 'FontWeight', 'bold');

%% =========================================================================
%  BLOQUE 8: GUARDAR FIGURA EN ALTA RESOLUCIÓN
%  =========================================================================
% Ruta de salida (crear directorio si no existe)
output_dir = fullfile('..', 'TFG GD5G', 'figs');
if ~exist(output_dir, 'dir')
    mkdir(output_dir);
end

output_file = fullfile(output_dir, 'comparativa_modelos.png');

% Guardar con DPI 300 (calidad para thesis)
fprintf('Guardando figura en: %s\n', output_file);
print(fig, output_file, '-dpng', '-r300');  % 300 DPI

% Verificar tamaño del fichero
info = dir(output_file);
fprintf('Figura guardada: %.2f MB\n', info.bytes / (1024^2));

%% =========================================================================
%  BLOQUE 9: INTERPRETACIÓN FÍSICA
%  =========================================================================
fprintf('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
fprintf('INTERPRETACIÓN FÍSICA\n');
fprintf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
fprintf('\n1. FSPL (Free Space Path Loss):\n');
fprintf('   → Modelo teórico de espacio libre sin obstáculos.\n');
fprintf('   → Representa la cota superior optimista (señal máxima posible).\n');
fprintf('   → RSRP medio: %.1f dBm\n\n', mean(RSRP_FSPL));

if tiene_comm_toolbox
    fprintf('2. Longley-Rice ITM:\n');
    fprintf('   → Modelo semi-empírico validado por NTIA/ITS (20 MHz - 20 GHz).\n');
    fprintf('   → Incorpora difracción, reflexión y terreno irregular.\n');
    fprintf('   → Coherente con despliegues reales 5G suburbanos.\n');
    fprintf('   → RSRP medio: %.1f dBm\n\n', mean(RSRP_B));
    fprintf('3. Diferencia FSPL - Longley-Rice:\n');
    fprintf('   → FSPL sobrestima la señal en %.1f dB de media.\n', Media);
    fprintf('   → Esta diferencia representa las pérdidas del terreno.\n');
    fprintf('   → En bordes del área (d > 1 km), ΔRSRP puede llegar a %.1f dB.\n', Max_Delta);
else
    fprintf('2. COST-231 Hata:\n');
    fprintf('   → Modelo empírico para 1.5-2.0 GHz (error ±15 dB a 3.5 GHz).\n');
    fprintf('   → Subestima la señal a frecuencias superiores.\n');
    fprintf('   → RSRP medio: %.1f dBm\n\n', mean(RSRP_B));
    fprintf('3. Diferencia FSPL - COST-231:\n');
    fprintf('   → COST-231 introduce pérdidas excesivas a 3.5 GHz.\n');
    fprintf('   → Diferencia media de %.1f dB.\n', Media);
    fprintf('   → ⚠️  ADVERTENCIA: usar con precaución fuera de su rango de validez.\n');
end

fprintf('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
fprintf('Script completado. ✓\n');
fprintf('Figura disponible en: %s\n', output_file);
fprintf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
