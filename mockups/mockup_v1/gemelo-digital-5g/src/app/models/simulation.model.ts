export interface Simulation {
  simulation_id: string;
  metadata: SimulationMetadata;
  coverage_area: CoverageArea;
  coverage_points: CoveragePoint[];
}

// ── DTOs del backend Spring Boot ──────────────────────────────────────────────

export interface ApiSimulationSummary {
  id: string;
  name: string;
  createdAt: string;
  metadata: SimulationMetadata;
}

export interface ApiCoveragePoint {
  lat: number;
  lng: number;
  rsrp: number;
}

export interface ApiSimulationParameters {
  area_km: number;
  espaciado_grid_m: number;
  [key: string]: unknown;
}

export interface ApiSimulation {
  id: string;
  name: string;
  createdAt: string;
  metadata: SimulationMetadata;
  parameters: ApiSimulationParameters;
  coveragePoints: ApiCoveragePoint[];
}

/** Mapea el formato del backend al modelo interno de la app */
export function apiToSimulation(api: ApiSimulation): Simulation {
  return {
    simulation_id: api.id,
    metadata: api.metadata,
    coverage_area: {
      width_km:       api.parameters?.area_km ?? 3,
      height_km:      api.parameters?.area_km ?? 3,
      grid_spacing_m: api.parameters?.espaciado_grid_m ?? 50
    },
    coverage_points: api.coveragePoints.map(p => ({
      latitude:  p.lat,
      longitude: p.lng,
      rsrp_dbm:  p.rsrp
    }))
  };
}

export interface SimulationMetadata {
  frequency_ghz: number;
  tx_power_dbm: number;
  antenna_height_m: number;
  tx_location: Location;
  simulation_date: string;
  model: string;
  terrain_data: string;
  scenario_name?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface CoverageArea {
  width_km: number;
  height_km: number;
  grid_spacing_m: number;
}

export interface CoveragePoint {
  latitude: number;
  longitude: number;
  rsrp_dbm: number;
}

export interface RsrpLevel {
  label: string;
  min: number;
  max: number;
  color: string;
  description: string;
}

export const RSRP_LEVELS: RsrpLevel[] = [
  { label: 'Excelente', min: -70, max: -40, color: '#10B981', description: 'Señal óptima para todos los servicios' },
  { label: 'Buena', min: -85, max: -70, color: '#FBBF24', description: 'Calidad de servicio estable' },
  { label: 'Aceptable', min: -100, max: -85, color: '#F97316', description: 'Servicio básico disponible' },
  { label: 'Débil', min: -140, max: -100, color: '#EF4444', description: 'Sin servicio o muy limitado' }
];

export interface SimulationStats {
  totalPoints: number;
  coverageArea: number;
  avgRsrp: number;
  minRsrp: number;
  maxRsrp: number;
  coverageRadius: number;
  pointsExcellent: number;
  pointsGood: number;
  pointsAcceptable: number;
  pointsWeak: number;
}
