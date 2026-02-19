import { Injectable, signal, computed } from '@angular/core';
import { Simulation, CoveragePoint, SimulationStats, RSRP_LEVELS } from '../models/simulation.model';
import { DEMO_SIMULATIONS } from '../../assets/data/demo-simulations';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private simulations = signal<Simulation[]>(DEMO_SIMULATIONS);
  private selectedSimulationId = signal<string | null>(DEMO_SIMULATIONS[0]?.simulation_id || null);
  private rsrpThreshold = signal<number>(-140);
  private selectedPoint = signal<CoveragePoint | null>(null);

  // Computed values
  readonly availableSimulations = computed(() => this.simulations());

  readonly currentSimulation = computed(() => {
    const id = this.selectedSimulationId();
    return this.simulations().find(s => s.simulation_id === id) || null;
  });

  readonly filteredCoveragePoints = computed(() => {
    const simulation = this.currentSimulation();
    const threshold = this.rsrpThreshold();
    if (!simulation) return [];
    return simulation.coverage_points.filter(p => p.rsrp_dbm >= threshold);
  });

  readonly currentThreshold = computed(() => this.rsrpThreshold());
  readonly currentSelectedPoint = computed(() => this.selectedPoint());

  readonly simulationStats = computed<SimulationStats | null>(() => {
    const simulation = this.currentSimulation();
    if (!simulation) return null;

    const points = simulation.coverage_points;
    const rsrpValues = points.map(p => p.rsrp_dbm);

    const excellent = points.filter(p => p.rsrp_dbm >= -70).length;
    const good = points.filter(p => p.rsrp_dbm >= -85 && p.rsrp_dbm < -70).length;
    const acceptable = points.filter(p => p.rsrp_dbm >= -100 && p.rsrp_dbm < -85).length;
    const weak = points.filter(p => p.rsrp_dbm < -100).length;

    return {
      totalPoints: points.length,
      coverageArea: simulation.coverage_area.width_km * simulation.coverage_area.height_km,
      avgRsrp: rsrpValues.reduce((a, b) => a + b, 0) / rsrpValues.length,
      minRsrp: Math.min(...rsrpValues),
      maxRsrp: Math.max(...rsrpValues),
      coverageRadius: Math.sqrt(simulation.coverage_area.width_km * simulation.coverage_area.height_km / Math.PI),
      pointsExcellent: excellent,
      pointsGood: good,
      pointsAcceptable: acceptable,
      pointsWeak: weak
    };
  });

  selectSimulation(id: string): void {
    this.selectedSimulationId.set(id);
    this.selectedPoint.set(null);
  }

  setRsrpThreshold(value: number): void {
    this.rsrpThreshold.set(value);
  }

  selectPoint(point: CoveragePoint | null): void {
    this.selectedPoint.set(point);
  }

  getRsrpLevel(rsrp: number): typeof RSRP_LEVELS[0] {
    return RSRP_LEVELS.find(level => rsrp >= level.min && rsrp < level.max) || RSRP_LEVELS[3];
  }

  normalizeRsrp(rsrp: number): number {
    // Normalizar de [-140, -40] dBm a [0, 1]
    return Math.max(0, Math.min(1, (rsrp + 140) / 100));
  }
}
