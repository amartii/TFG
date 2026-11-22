export interface Simulation {
  simulation_id: string;
  metadata: SimulationMetadata;
  coverage_area: CoverageArea;
  coverage_points: CoveragePoint[];
}

// ── DTOs del backend Spring Boot ──────────────────────────────────────────────

export interface ApiSimulationSummary {
  id: string;
  name: string | null;
  createdAt: string | null;
  metadata: SimulationMetadata | null;
  valid: boolean;
  error: string | null;
}

export interface AvailableSimulationSummary {
  simulation_id: string;
  name: string | null;
  created_at: string | null;
  metadata: SimulationMetadata | null;
  valid: boolean;
  error: string | null;
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

export interface TransmitterInput {
  latitude: number;
  longitude: number;
  txHeightM: number;
  txPowerDbm: number;
  txGainDbi: number;
  antennaAzimuthDeg?: number;
  antennaDowntiltDeg?: number;
}

export interface CreateSimulationRequest {
  name: string;
  frequencyGHz: number;
  rxHeightM: number;
  areaKm: number;
  gridSpacingM: number;
  cableLossDb: number;
  clutterLossDb?: number;
  transmitters: [TransmitterInput];
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
  const txGain = numberParameter(api.parameters, 'ganancia_tx_dBi') ?? api.metadata.tx_gain_dbi;
  const cableLoss = numberParameter(api.parameters, 'perdidas_cable_dB')
    ?? api.metadata.cable_loss_db
    ?? 2;
  const eirp = api.metadata.eirp_dbm
    ?? (txGain === undefined ? undefined : api.metadata.tx_power_dbm + txGain - cableLoss);

  return {
    simulation_id: api.id,
    metadata: {
      ...api.metadata,
      tx_gain_dbi: txGain,
      cable_loss_db: cableLoss,
      eirp_dbm: eirp
    },
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

function numberParameter(parameters: ApiSimulationParameters, name: string): number | undefined {
  const value = parameters?.[name];
  return typeof value === 'number' ? value : undefined;
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
  tx_gain_dbi?: number;
  cable_loss_db?: number;
  eirp_dbm?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface TerrainExtent {
  westLongitude: number;
  southLatitude: number;
  eastLongitude: number;
  northLatitude: number;
  longitudePixelSizeDeg: number;
  latitudePixelSizeDeg: number;
  noDataValue: number | null;
  containsNoDataCells: boolean;
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

export function rsrpInRange(rsrp: number, min: number, max: number): boolean {
  return rsrp >= min && (rsrp < max || (max === RSRP_LEVELS[0].max && rsrp === max));
}

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
