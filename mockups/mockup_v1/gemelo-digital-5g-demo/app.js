/**
 * GEMELO DIGITAL 5G - APLICACIÓN JAVASCRIPT
 * TFG: Planificación de Cobertura Burbujas Tácticas
 * Autor: Álvaro Martínez Téllez - URJC 2025/2026
 */

// ==========================================
// UTILIDAD: Validación de Elementos DOM
// ==========================================
const DOM_ELEMENTS = {
  map: 'map',
  simulationSelect: 'simulationSelect',
  configParams: 'configParams',
  rsrpSlider: 'rsrpSlider',
  thresholdValue: 'thresholdValue',
  visiblePoints: 'visiblePoints',
  statsGrid: 'statsGrid',
  distributionBars: 'distributionBars',
  txCoords: 'txCoords',
  lastUpdate: 'lastUpdate',
  infoPanel: 'infoPanel',
  infoPanelContent: 'infoPanelContent',
  heatmapToggle: 'heatmapToggle',
  docsModal: 'docsModal',
  aboutModal: 'aboutModal'
};

function validateDOMElement(elemId) {
  const elem = document.getElementById(elemId);
  if (!elem) {
    console.error(`Warning: DOM element with ID '${elemId}' not found`);
    return null;
  }
  return elem;
}

function validateAllElements() {
  const missing = Object.entries(DOM_ELEMENTS)
    .filter(([, id]) => !document.getElementById(id))
    .map(([name]) => name);
  
  if (missing.length > 0) {
    console.warn(`Missing DOM elements: ${missing.join(', ')}`);
  }
}

// ==========================================
// DATOS DE SIMULACIONES
// ==========================================

// Función para generar puntos de cobertura realistas
function generateCoveragePoints(txLat, txLon, widthKm, heightKm, gridSpacingM, txPowerDbm) {
  const points = [];
  const latDegPerKm = 1 / 111;
  const lonDegPerKm = 1 / (111 * Math.cos(txLat * Math.PI / 180));
  const gridSpacingKm = gridSpacingM / 1000;
  const stepsX = Math.floor(widthKm / gridSpacingKm);
  const stepsY = Math.floor(heightKm / gridSpacingKm);

  for (let i = -stepsX / 2; i <= stepsX / 2; i++) {
    for (let j = -stepsY / 2; j <= stepsY / 2; j++) {
      const lat = txLat + j * gridSpacingKm * latDegPerKm;
      const lon = txLon + i * gridSpacingKm * lonDegPerKm;

      // Calcular distancia al transmisor
      const distKm = Math.sqrt(
        Math.pow((lat - txLat) / latDegPerKm, 2) +
        Math.pow((lon - txLon) / lonDegPerKm, 2)
      );

      // Modelo de propagación simplificado (Longley-Rice aproximado)
      const freq = 3.5; // GHz
      let pathLoss = 32.45 + 20 * Math.log10(Math.max(0.01, distKm)) + 20 * Math.log10(freq * 1000);

      // Añadir variabilidad por terreno
      const terrainVariation = (Math.random() - 0.5) * 15;
      const shadowFading = (Math.random() - 0.5) * 8;
      const hasObstacle = Math.random() < 0.15;
      const obstacleLoss = hasObstacle ? 15 + Math.random() * 20 : 0;

      pathLoss += terrainVariation + shadowFading + obstacleLoss;

      // RSRP = EIRP - PathLoss
      let rsrp = txPowerDbm - pathLoss;
      rsrp = Math.max(-140, Math.min(-40, rsrp));

      points.push({
        latitude: lat,
        longitude: lon,
        rsrp_dbm: Math.round(rsrp * 10) / 10
      });
    }
  }

  return points;
}

// Simulaciones disponibles
const SIMULATIONS = {
  'campus-urjc': {
    id: 'campus-urjc',
    name: 'Campus URJC Fuenlabrada',
    metadata: {
      frequency_ghz: 3.5,
      tx_power_dbm: 40,
      antenna_height_m: 10,
      tx_location: { latitude: 40.2897, longitude: -3.8244 },
      simulation_date: '2026-02-15T10:30:00Z',
      model: 'Longley-Rice',
      terrain_data: 'SRTM 30m'
    },
    coverage_area: { width_km: 3.0, height_km: 3.0, grid_spacing_m: 50 },
    coverage_points: null
  },
  'sierra-madrid': {
    id: 'sierra-madrid',
    name: 'Sierra de Madrid - Zona Rural',
    metadata: {
      frequency_ghz: 3.5,
      tx_power_dbm: 43,
      antenna_height_m: 15,
      tx_location: { latitude: 40.7897, longitude: -3.9500 },
      simulation_date: '2026-02-16T14:00:00Z',
      model: 'Longley-Rice',
      terrain_data: 'SRTM 30m'
    },
    coverage_area: { width_km: 4.0, height_km: 4.0, grid_spacing_m: 75 },
    coverage_points: null
  },
  'centro-madrid': {
    id: 'centro-madrid',
    name: 'Centro de Madrid - Urbano Denso',
    metadata: {
      frequency_ghz: 3.5,
      tx_power_dbm: 38,
      antenna_height_m: 8,
      tx_location: { latitude: 40.4168, longitude: -3.7038 },
      simulation_date: '2026-02-17T09:15:00Z',
      model: 'Longley-Rice',
      terrain_data: 'SRTM 30m + OSM Buildings'
    },
    coverage_area: { width_km: 2.0, height_km: 2.0, grid_spacing_m: 30 },
    coverage_points: null
  }
};

// Generar puntos para cada simulación
Object.keys(SIMULATIONS).forEach(key => {
  const sim = SIMULATIONS[key];
  sim.coverage_points = generateCoveragePoints(
    sim.metadata.tx_location.latitude,
    sim.metadata.tx_location.longitude,
    sim.coverage_area.width_km,
    sim.coverage_area.height_km,
    sim.coverage_area.grid_spacing_m,
    sim.metadata.tx_power_dbm
  );
});

// ==========================================
// ESTADO GLOBAL
// ==========================================
let map;
let currentSimulation = SIMULATIONS['campus-urjc'];
let heatmapLayer = null;
let txMarker = null;
let rsrpThreshold = -140;
let heatmapVisible = true;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  // Validar todos los elementos requeridos antes de inicializar
  validateAllElements();
  
  // Verificar que Leaflet está disponible
  if (typeof L === 'undefined') {
    console.error('ERROR: Leaflet library not loaded. Please check your internet connection or CDN availability');
    return;
  }
  
  // Verificar que el mapa existe
  const mapElement = validateDOMElement('map');
  if (!mapElement) {
    console.error('ERROR: Map container element not found');
    return;
  }

  try {
    initMap();
    loadSimulation(currentSimulation);
    updateLastUpdate();
    setInterval(updateLastUpdate, 1000);
    console.log('✓ Application initialized successfully');
  } catch (error) {
    console.error('ERROR during initialization:', error);
  }
});

function initMap() {
  // Validar elemento del mapa
  if (!document.getElementById('map')) {
    throw new Error('Map container not found in DOM');
  }

  // Inicializar mapa
  map = L.map('map', {
    center: [currentSimulation.metadata.tx_location.latitude, currentSimulation.metadata.tx_location.longitude],
    zoom: 13,
    zoomControl: true,
    attributionControl: true
  });

  // Capa base oscura
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
}

// ==========================================
// FUNCIONES DE SIMULACIÓN
// ==========================================
function loadSimulation(simulation) {
  currentSimulation = simulation;

  // Actualizar UI
  updateConfigParams();
  updateStats();
  updateHeatmap();
  updateTxMarker();
  updateTxCoords();

  // Centrar mapa
  map.setView([simulation.metadata.tx_location.latitude, simulation.metadata.tx_location.longitude], 13);
}

function changeSimulation() {
  const select = document.getElementById('simulationSelect');
  const simId = select.value;
  loadSimulation(SIMULATIONS[simId]);
}

function updateConfigParams() {
  const params = validateDOMElement('configParams');
  if (!params) return;
  
  const sim = currentSimulation;
  const powerWatts = (Math.pow(10, sim.metadata.tx_power_dbm / 10) / 1000).toFixed(1);

  params.innerHTML = `
    <div class="param">
      <div class="param__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <circle cx="12" cy="20" r="1"/>
        </svg>
      </div>
      <div class="param__content">
        <span class="param__label">Frecuencia</span>
        <span class="param__value font-mono">${sim.metadata.frequency_ghz} GHz</span>
        <span class="param__badge">Banda n78</span>
      </div>
    </div>
    <div class="param">
      <div class="param__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <div class="param__content">
        <span class="param__label">Potencia EIRP</span>
        <span class="param__value font-mono">${sim.metadata.tx_power_dbm} dBm</span>
        <span class="param__badge">${powerWatts}W</span>
      </div>
    </div>
    <div class="param">
      <div class="param__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20"/>
          <path d="M2 12h20"/>
          <path d="M12 2l4 4-4 4"/>
        </svg>
      </div>
      <div class="param__content">
        <span class="param__label">Altura Antena</span>
        <span class="param__value font-mono">${sim.metadata.antenna_height_m} m</span>
        <span class="param__badge">Mástil</span>
      </div>
    </div>
    <div class="param">
      <div class="param__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      </div>
      <div class="param__content">
        <span class="param__label">Área Simulada</span>
        <span class="param__value font-mono">${sim.coverage_area.width_km}×${sim.coverage_area.height_km} km</span>
        <span class="param__badge">Grid ${sim.coverage_area.grid_spacing_m}m</span>
      </div>
    </div>
    <div class="param">
      <div class="param__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <div class="param__content">
        <span class="param__label">Modelo</span>
        <span class="param__value">${sim.metadata.model}</span>
        <span class="param__badge">${sim.metadata.terrain_data}</span>
      </div>
    </div>
  `;
}

function updateStats() {
  const statsGrid = validateDOMElement('statsGrid');
  const distributionBars = validateDOMElement('distributionBars');
  
  if (!statsGrid || !distributionBars) return;

  const points = currentSimulation.coverage_points;
  const rsrpValues = points.map(p => p.rsrp_dbm);

  const excellent = points.filter(p => p.rsrp_dbm >= -70).length;
  const good = points.filter(p => p.rsrp_dbm >= -85 && p.rsrp_dbm < -70).length;
  const acceptable = points.filter(p => p.rsrp_dbm >= -100 && p.rsrp_dbm < -85).length;
  const weak = points.filter(p => p.rsrp_dbm < -100).length;

  const total = points.length;
  const area = currentSimulation.coverage_area.width_km * currentSimulation.coverage_area.height_km;
  const avgRsrp = rsrpValues.reduce((a, b) => a + b, 0) / rsrpValues.length;
  const radius = Math.sqrt(area / Math.PI);

  // Actualizar grid de estadísticas
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__value font-mono">${area.toFixed(1)}</div>
      <div class="stat-card__label">km² Área</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value font-mono">${total.toLocaleString()}</div>
      <div class="stat-card__label">Puntos</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value font-mono">${avgRsrp.toFixed(1)}</div>
      <div class="stat-card__label">dBm Medio</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value font-mono">${radius.toFixed(2)}</div>
      <div class="stat-card__label">km Radio</div>
    </div>
  `;

  // Actualizar barras de distribución
  const pExcellent = (excellent / total * 100).toFixed(0);
  const pGood = (good / total * 100).toFixed(0);
  const pAcceptable = (acceptable / total * 100).toFixed(0);
  const pWeak = (weak / total * 100).toFixed(0);

  distributionBars.innerHTML = `
    <div class="dist-bar dist-bar--excellent" style="width: ${pExcellent}%">
      <span class="dist-bar__label">${pExcellent}%</span>
    </div>
    <div class="dist-bar dist-bar--good" style="width: ${pGood}%">
      <span class="dist-bar__label">${pGood}%</span>
    </div>
    <div class="dist-bar dist-bar--acceptable" style="width: ${pAcceptable}%">
      <span class="dist-bar__label">${pAcceptable}%</span>
    </div>
    <div class="dist-bar dist-bar--weak" style="width: ${pWeak}%">
      <span class="dist-bar__label">${pWeak}%</span>
    </div>
  `;
}
  const pGood = (good / total * 100).toFixed(0);
  const pAcceptable = (acceptable / total * 100).toFixed(0);
  const pWeak = (weak / total * 100).toFixed(0);

  document.getElementById('distributionBars').innerHTML = `
    <div class="dist-bar dist-bar--excellent" style="width: ${pExcellent}%">
      <span class="dist-bar__label">${pExcellent}%</span>
    </div>
    <div class="dist-bar dist-bar--good" style="width: ${pGood}%">
      <span class="dist-bar__label">${pGood}%</span>
    </div>
    <div class="dist-bar dist-bar--acceptable" style="width: ${pAcceptable}%">
      <span class="dist-bar__label">${pAcceptable}%</span>
    </div>
    <div class="dist-bar dist-bar--weak" style="width: ${pWeak}%">
      <span class="dist-bar__label">${pWeak}%</span>
    </div>
  `;
}

// ==========================================
// FUNCIONES DE MAPA
// ==========================================
function updateHeatmap() {
  // Eliminar capa anterior
  if (heatmapLayer) {
    map.removeLayer(heatmapLayer);
  }

  if (!heatmapVisible) {
    updateVisiblePoints();
    return;
  }

  // Filtrar puntos según umbral
  const filteredPoints = currentSimulation.coverage_points.filter(p => p.rsrp_dbm >= rsrpThreshold);

  // Crear capa de círculos como heatmap
  heatmapLayer = L.layerGroup();

  filteredPoints.forEach(point => {
    const color = getHeatColor(point.rsrp_dbm);
    const circle = L.circleMarker([point.latitude, point.longitude], {
      radius: 6,
      fillColor: color,
      fillOpacity: 0.7,
      color: color,
      weight: 0,
      opacity: 0.9
    });

    circle.on('click', () => showPointInfo(point));
    heatmapLayer.addLayer(circle);
  });

  heatmapLayer.addTo(map);
  updateVisiblePoints();
}

function getHeatColor(rsrp) {
  if (rsrp >= -70) return '#10b981'; // Excelente
  if (rsrp >= -85) return '#fbbf24'; // Buena
  if (rsrp >= -100) return '#f97316'; // Aceptable
  return '#ef4444'; // Débil
}

function updateTxMarker() {
  if (txMarker) {
    map.removeLayer(txMarker);
  }

  const loc = currentSimulation.metadata.tx_location;

  // Crear icono personalizado
  const txIcon = L.divIcon({
    className: 'tx-marker',
    html: `
      <div class="tx-marker__inner">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L12 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          <path d="M5 8L12 2L19 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="2" r="3" fill="currentColor"/>
          <path d="M8 12C8 12 6 10 6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
          <path d="M16 12C16 12 18 10 18 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
          <path d="M5 15C5 15 2 12 2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
          <path d="M19 15C19 15 22 12 22 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
        </svg>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48]
  });

  txMarker = L.marker([loc.latitude, loc.longitude], { icon: txIcon })
    .addTo(map)
    .bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong style="color: #00d4aa;">Transmisor 5G</strong><br>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">
          ${loc.latitude.toFixed(4)}°N, ${Math.abs(loc.longitude).toFixed(4)}°W
        </span><br>
        <span style="font-size: 11px; color: #8b949e;">
          ${currentSimulation.metadata.tx_power_dbm} dBm | ${currentSimulation.metadata.antenna_height_m}m altura
        </span>
      </div>
    `);
}

function updateTxCoords() {
  const loc = currentSimulation.metadata.tx_location;
  const txCoords = validateDOMElement('txCoords');
  if (txCoords) {
    txCoords.textContent =
      `${loc.latitude.toFixed(4)}°N, ${Math.abs(loc.longitude).toFixed(4)}°W`;
  }
}

// ==========================================
// FUNCIONES DE FILTRADO
// ==========================================
function updateThreshold(value) {
  rsrpThreshold = parseInt(value);
  const thresholdValue = validateDOMElement('thresholdValue');
  if (thresholdValue) {
    thresholdValue.textContent = `${rsrpThreshold} dBm`;
  }
  updateHeatmap();
}

function updateVisiblePoints() {
  const filtered = currentSimulation.coverage_points.filter(p => p.rsrp_dbm >= rsrpThreshold);
  const total = currentSimulation.coverage_points.length;
  const visiblePoints = validateDOMElement('visiblePoints');
  if (visiblePoints) {
    visiblePoints.textContent = `${filtered.length.toLocaleString()} / ${total.toLocaleString()}`;
  }
}

// ==========================================
// CONTROLES DEL MAPA
// ==========================================
function centerOnTx() {
  const loc = currentSimulation.metadata.tx_location;
  map.setView([loc.latitude, loc.longitude], 14);
}

function toggleHeatmap() {
  heatmapVisible = !heatmapVisible;
  const btn = validateDOMElement('heatmapToggle');
  if (btn) {
    btn.classList.toggle('active', heatmapVisible);
  }
  updateHeatmap();
}

function fitBounds() {
  const points = currentSimulation.coverage_points;
  if (points.length > 0) {
    const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [20, 20] });
  }
}

// ==========================================
// PANEL DE INFORMACIÓN
// ==========================================
function showPointInfo(point) {
  const panel = validateDOMElement('infoPanel');
  const content = validateDOMElement('infoPanelContent');

  if (!panel || !content) return;

  const level = getRsrpLevel(point.rsrp_dbm);
  const bars = getBars(point.rsrp_dbm);

  content.innerHTML = `
    <div class="signal-indicator signal-indicator--${level.class}">
      <div class="signal-indicator__value font-mono">${point.rsrp_dbm.toFixed(1)} dBm</div>
      <div class="signal-indicator__label">${level.label}</div>
      <div class="signal-indicator__bars">
        ${bars}
      </div>
    </div>
    <div class="info-row">
      <span class="info-row__label">Latitud</span>
      <span class="info-row__value font-mono">${point.latitude.toFixed(6)}°</span>
    </div>
    <div class="info-row">
      <span class="info-row__label">Longitud</span>
      <span class="info-row__value font-mono">${point.longitude.toFixed(6)}°</span>
    </div>
    <div class="info-description">
      <svg class="info-description__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <p>${level.description}</p>
    </div>
  `;

  panel.style.display = 'block';
}

function closeInfoPanel() {
  const infoPanel = validateDOMElement('infoPanel');
  if (infoPanel) {
    infoPanel.style.display = 'none';
  }
}

function getRsrpLevel(rsrp) {
  if (rsrp >= -70) return { label: 'Excelente', class: 'excellent', description: 'Señal óptima para todos los servicios 5G, incluyendo eMBB y URLLC.' };
  if (rsrp >= -85) return { label: 'Buena', class: 'good', description: 'Calidad de servicio estable para la mayoría de aplicaciones.' };
  if (rsrp >= -100) return { label: 'Aceptable', class: 'acceptable', description: 'Servicio básico disponible, posible degradación en alta demanda.' };
  return { label: 'Débil', class: 'weak', description: 'Sin servicio o muy limitado. Zona de sombra o interferencia.' };
}

function getBars(rsrp) {
  const bar1 = rsrp >= -140 ? 'active' : '';
  const bar2 = rsrp >= -100 ? 'active' : '';
  const bar3 = rsrp >= -85 ? 'active' : '';
  const bar4 = rsrp >= -70 ? 'active' : '';
  return `
    <div class="bar ${bar1}"></div>
    <div class="bar ${bar2}"></div>
    <div class="bar ${bar3}"></div>
    <div class="bar ${bar4}"></div>
  `;
}

// ==========================================
// MODALES
// ==========================================
function showDocs() {
  const docsModal = validateDOMElement('docsModal');
  if (docsModal) {
    docsModal.style.display = 'flex';
  }
}

function showAbout() {
  const aboutModal = validateDOMElement('aboutModal');
  if (aboutModal) {
    aboutModal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Cerrar modal con Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal('docsModal');
    closeModal('aboutModal');
    closeInfoPanel();
  }
});

// ==========================================
// UTILIDADES
// ==========================================
function updateLastUpdate() {
  const now = new Date();
  const lastUpdate = validateDOMElement('lastUpdate');
  if (lastUpdate) {
    lastUpdate.textContent =
      `Última actualización: ${now.toLocaleTimeString('es-ES')}`;
  }
}
