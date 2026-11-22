import { Simulation } from '../../app/models/simulation.model';

// Función para generar puntos de cobertura realistas
function generateCoveragePoints(
  txLat: number,
  txLon: number,
  widthKm: number,
  heightKm: number,
  gridSpacingM: number,
  txPowerDbm: number
): { latitude: number; longitude: number; rsrp_dbm: number }[] {
  const points: { latitude: number; longitude: number; rsrp_dbm: number }[] = [];

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
      // Path Loss = FSPL + pérdidas adicionales por terreno
      const freq = 3.5; // GHz
      let pathLoss = 32.45 + 20 * Math.log10(Math.max(0.01, distKm)) + 20 * Math.log10(freq * 1000);

      // Añadir variabilidad por terreno (modelo estadístico)
      const terrainVariation = (Math.random() - 0.5) * 15;
      const shadowFading = (Math.random() - 0.5) * 8;

      // Algunas zonas con obstáculos (simular edificios/terreno)
      const hasObstacle = Math.random() < 0.15;
      const obstacleLoss = hasObstacle ? 15 + Math.random() * 20 : 0;

      pathLoss += terrainVariation + shadowFading + obstacleLoss;

      // RSRP = EIRP - PathLoss
      let rsrp = txPowerDbm - pathLoss;

      // Limitar a rango realista
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

// Simulación 1: Campus URJC Fuenlabrada
const campusURJC = generateCoveragePoints(40.2897, -3.8244, 3.0, 3.0, 50, 40);

// Simulación 2: Sierra de Madrid (Rural)
const sierraMadrid = generateCoveragePoints(40.7897, -3.9500, 4.0, 4.0, 75, 43);

// Simulación 3: Centro Madrid (Urbano denso)
const centroMadrid = generateCoveragePoints(40.4168, -3.7038, 2.0, 2.0, 30, 38);

export const DEMO_SIMULATIONS: Simulation[] = [
  {
    simulation_id: 'sim-001-campus-urjc',
    metadata: {
      frequency_ghz: 3.5,
      tx_power_dbm: 40,
      antenna_height_m: 10,
      tx_location: { latitude: 40.2897, longitude: -3.8244 },
      simulation_date: '2026-02-15T10:30:00Z',
      model: 'Longley-Rice',
      terrain_data: 'SRTM 30m',
      scenario_name: 'Campus URJC Fuenlabrada'
    },
    coverage_area: {
      width_km: 3.0,
      height_km: 3.0,
      grid_spacing_m: 50
    },
    coverage_points: campusURJC
  },
  {
    simulation_id: 'sim-002-sierra-madrid',
    metadata: {
      frequency_ghz: 3.5,
      tx_power_dbm: 43,
      antenna_height_m: 15,
      tx_location: { latitude: 40.7897, longitude: -3.9500 },
      simulation_date: '2026-02-16T14:00:00Z',
      model: 'Longley-Rice',
      terrain_data: 'SRTM 30m',
      scenario_name: 'Sierra de Madrid - Zona Rural'
    },
    coverage_area: {
      width_km: 4.0,
      height_km: 4.0,
      grid_spacing_m: 75
    },
    coverage_points: sierraMadrid
  },
  {
    simulation_id: 'sim-003-centro-madrid',
    metadata: {
      frequency_ghz: 3.5,
      tx_power_dbm: 38,
      antenna_height_m: 8,
      tx_location: { latitude: 40.4168, longitude: -3.7038 },
      simulation_date: '2026-02-17T09:15:00Z',
      model: 'Longley-Rice',
      terrain_data: 'SRTM 30m + OSM Buildings',
      scenario_name: 'Centro de Madrid - Urbano Denso'
    },
    coverage_area: {
      width_km: 2.0,
      height_km: 2.0,
      grid_spacing_m: 30
    },
    coverage_points: centroMadrid
  }
];
