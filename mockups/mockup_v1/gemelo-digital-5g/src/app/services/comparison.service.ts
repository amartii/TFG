import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SimulationService } from './simulation.service';
import { Simulation, ApiSimulation, apiToSimulation, CoveragePoint } from '../models/simulation.model';

const API_BASE = 'http://localhost:8080/api/simulations';

export type ComparisonMode = 'toggle' | 'difference' | 'overlay';

export interface DifferencePoint {
  latitude: number;
  longitude: number;
  rsrp_a: number;
  rsrp_b: number;
  delta: number;        // rsrp_a - rsrp_b (positivo = A mejor)
  absDelta: number;
}

@Injectable({ providedIn: 'root' })
export class ComparisonService {

  private readonly http = inject(HttpClient);
  private readonly simulationService = inject(SimulationService);

  readonly active = signal<boolean>(false);
  readonly simulationBId = signal<string | null>(null);
  private simulationBData = signal<Simulation | null>(null);
  readonly loadingB = signal<boolean>(false);

  // Modo de visualización y controles
  readonly mode = signal<ComparisonMode>('difference');
  readonly toggleView = signal<'A' | 'B'>('A');   // Para modo toggle
  readonly overlayOpacity = signal<number>(0.5);   // Para modo overlay

  readonly simulationB = computed(() => this.simulationBData());

  readonly filteredCoveragePointsB = computed(() => {
    const sim = this.simulationBData();
    const threshold = this.simulationService.currentThreshold();
    if (!sim) return [];
    return sim.coverage_points.filter(p => p.rsrp_dbm >= threshold);
  });

  // Mapa de diferencias: empareja puntos de A y B por proximidad en la cuadrícula
  readonly differencePoints = computed<DifferencePoint[]>(() => {
    const simA = this.simulationService.currentSimulation();
    const simB = this.simulationBData();
    if (!simA || !simB) return [];

    const pointsA = simA.coverage_points;
    const pointsB = simB.coverage_points;
    if (pointsA.length === 0 || pointsB.length === 0) return [];

    // Indexar puntos B en un grid espacial para matching rápido
    const gridKey = (lat: number, lng: number) =>
      `${lat.toFixed(4)},${lng.toFixed(4)}`;

    const bMap = new Map<string, CoveragePoint>();
    for (const p of pointsB) {
      bMap.set(gridKey(p.latitude, p.longitude), p);
    }

    const result: DifferencePoint[] = [];
    for (const pA of pointsA) {
      const key = gridKey(pA.latitude, pA.longitude);
      const pB = bMap.get(key);
      if (pB) {
        const delta = pA.rsrp_dbm - pB.rsrp_dbm;
        result.push({
          latitude: pA.latitude,
          longitude: pA.longitude,
          rsrp_a: pA.rsrp_dbm,
          rsrp_b: pB.rsrp_dbm,
          delta,
          absDelta: Math.abs(delta)
        });
      }
    }
    return result;
  });

  // Estadísticas de la comparación: agregadas siempre que A y B estén cargadas;
  // si además existe solapamiento espacial, se añade el desglose por zona.
  readonly diffStats = computed(() => {
    const simA = this.simulationService.currentSimulation();
    const simB = this.simulationBData();
    if (!simA || !simB) return null;

    const rsrpsA = simA.coverage_points.map(p => p.rsrp_dbm);
    const rsrpsB = simB.coverage_points.map(p => p.rsrp_dbm);
    if (rsrpsA.length === 0 || rsrpsB.length === 0) return null;

    const avgA = rsrpsA.reduce((a, b) => a + b, 0) / rsrpsA.length;
    const avgB = rsrpsB.reduce((a, b) => a + b, 0) / rsrpsB.length;
    const avgDelta = avgA - avgB;

    const matched = this.differencePoints();
    const hasSpatialOverlap = matched.length > 0;

    if (hasSpatialOverlap) {
      const deltas = matched.map(p => p.delta);
      return {
        avgDelta,
        maxDelta: Math.max(...deltas),
        minDelta: Math.min(...deltas),
        aBetterCount: matched.filter(p => p.delta > 2).length,
        bBetterCount: matched.filter(p => p.delta < -2).length,
        similarCount: matched.filter(p => Math.abs(p.delta) <= 2).length,
        totalMatched: matched.length,
        hasSpatialOverlap: true
      };
    }

    // Sin solapamiento: comparación agregada (escenarios en zonas distintas).
    return {
      avgDelta,
      maxDelta: avgDelta,
      minDelta: avgDelta,
      aBetterCount: 0,
      bBetterCount: 0,
      similarCount: 0,
      totalMatched: 0,
      hasSpatialOverlap: false
    };
  });

  readonly comparableSimulations = computed(() => {
    const all = this.simulationService.availableSimulations();
    const currentId = this.simulationService.currentSimulation()?.simulation_id;
    return all.filter(s => s.simulation_id !== currentId);
  });

  startComparison(): void {
    this.active.set(true);
    this.mode.set('difference');
  }

  stopComparison(): void {
    this.active.set(false);
    this.simulationBId.set(null);
    this.simulationBData.set(null);
    this.toggleView.set('A');
    this.overlayOpacity.set(0.5);
  }

  setMode(mode: ComparisonMode): void {
    this.mode.set(mode);
  }

  async selectSimulationB(id: string): Promise<void> {
    this.simulationBId.set(id);
    this.loadingB.set(true);

    try {
      const full = await firstValueFrom(
        this.http.get<ApiSimulation>(`${API_BASE}/${id}`)
      );
      this.simulationBData.set(apiToSimulation(full));
    } catch (e) {
      console.error('[ComparisonService] Error cargando simulación B:', e);
      this.simulationBData.set(null);
    } finally {
      this.loadingB.set(false);
    }
  }
}
