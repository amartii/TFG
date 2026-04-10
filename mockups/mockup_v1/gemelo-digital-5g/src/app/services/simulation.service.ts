import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Simulation, CoveragePoint, SimulationStats, RSRP_LEVELS,
  ApiSimulationSummary, ApiSimulation, apiToSimulation
} from '../models/simulation.model';

const API_BASE = 'http://localhost:8080/api/simulations';

@Injectable({ providedIn: 'root' })
export class SimulationService {

  private readonly http = inject(HttpClient);

  // ── Estado interno ──────────────────────────────────────────────────────────
  private simulations        = signal<Simulation[]>([]);
  private selectedSimulationId = signal<string | null>(null);
  private rsrpThreshold      = signal<number>(-140);
  private selectedPoint      = signal<CoveragePoint | null>(null);
  readonly loading           = signal<boolean>(false);
  readonly error             = signal<string | null>(null);

  // ── Computed ────────────────────────────────────────────────────────────────
  readonly availableSimulations = computed(() => this.simulations());

  readonly currentSimulation = computed(() => {
    const id = this.selectedSimulationId();
    return this.simulations().find(s => s.simulation_id === id) || null;
  });

  readonly filteredCoveragePoints = computed(() => {
    const simulation = this.currentSimulation();
    const threshold  = this.rsrpThreshold();
    if (!simulation) return [];
    return simulation.coverage_points.filter(p => p.rsrp_dbm >= threshold);
  });

  readonly currentThreshold      = computed(() => this.rsrpThreshold());
  readonly currentSelectedPoint  = computed(() => this.selectedPoint());

  readonly simulationStats = computed<SimulationStats | null>(() => {
    const simulation = this.currentSimulation();
    if (!simulation) return null;

    const points     = simulation.coverage_points;
    const rsrpValues = points.map(p => p.rsrp_dbm);

    return {
      totalPoints:      points.length,
      coverageArea:     simulation.coverage_area.width_km * simulation.coverage_area.height_km,
      avgRsrp:          rsrpValues.reduce((a, b) => a + b, 0) / rsrpValues.length,
      minRsrp:          Math.min(...rsrpValues),
      maxRsrp:          Math.max(...rsrpValues),
      coverageRadius:   Math.sqrt(simulation.coverage_area.width_km * simulation.coverage_area.height_km / Math.PI),
      pointsExcellent:  points.filter(p => p.rsrp_dbm >= -70).length,
      pointsGood:       points.filter(p => p.rsrp_dbm >= -85 && p.rsrp_dbm < -70).length,
      pointsAcceptable: points.filter(p => p.rsrp_dbm >= -100 && p.rsrp_dbm < -85).length,
      pointsWeak:       points.filter(p => p.rsrp_dbm < -100).length
    };
  });

  // ── API calls ───────────────────────────────────────────────────────────────

  /**
   * Carga el listado de simulaciones disponibles desde el backend.
   * Llamar al inicializar la app (p.ej. en AppComponent.ngOnInit).
   */
  async loadSimulations(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const summaries = await firstValueFrom(
        this.http.get<ApiSimulationSummary[]>(API_BASE)
      );
      // Crear objetos Simulation con coverage_points vacío hasta que se seleccionen
      const partial: Simulation[] = summaries.map(s => ({
        simulation_id:  s.id,
        metadata:       s.metadata,
        coverage_area:  { width_km: 3, height_km: 3, grid_spacing_m: 50 },
        coverage_points: []
      }));
      this.simulations.set(partial);

      // Seleccionar la primera por defecto
      if (partial.length > 0) {
        await this.selectSimulation(partial[0].simulation_id);
      }
    } catch (e) {
      this.error.set('No se pudo conectar con el backend. Asegúrate de que Spring Boot está en localhost:8080.');
      console.error('[SimulationService] Error cargando simulaciones:', e);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Selecciona una simulación y carga sus coveragePoints desde el backend.
   */
  async selectSimulation(id: string): Promise<void> {
    this.selectedSimulationId.set(id);
    this.selectedPoint.set(null);

    // Si ya tiene puntos cargados, no volvemos a pedir
    const existing = this.simulations().find(s => s.simulation_id === id);
    if (existing && existing.coverage_points.length > 0) return;

    this.loading.set(true);
    try {
      const full = await firstValueFrom(
        this.http.get<ApiSimulation>(`${API_BASE}/${id}`)
      );
      const mapped = apiToSimulation(full);
      this.simulations.update(list =>
        list.map(s => s.simulation_id === id ? mapped : s)
      );
    } catch (e) {
      this.error.set(`Error cargando simulación ${id}.`);
      console.error('[SimulationService] Error cargando detalle:', e);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Acciones síncronas ──────────────────────────────────────────────────────

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
    return Math.max(0, Math.min(1, (rsrp + 140) / 100));
  }
}
