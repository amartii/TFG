import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Simulation, CoveragePoint, SimulationStats, RSRP_LEVELS,
  ApiSimulationSummary, ApiSimulation, CreateSimulationRequest, Location, TerrainExtent,
  AvailableSimulationSummary, apiToSimulation, rsrpInRange
} from '../models/simulation.model';

const API_ROOT = 'http://localhost:8080/api';
const API_BASE = `${API_ROOT}/simulations`;

function isErrorPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function simulationErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado al solicitar la simulación.';
  }

  const payload = error.error;
  const detail = isErrorPayload(payload) ? payload['detail'] : undefined;
  if (typeof detail === 'string') return detail;

  if (error.status === 405) {
    return 'El backend activo no admite POST /api/simulations. Inicia Spring Boot con la versión que incluye simulaciones bajo demanda.';
  }
  if (error.status === 0) {
    return 'No se pudo completar la petición al backend. Comprueba la conexión y que Spring Boot permita CORS desde localhost:4200.';
  }

  const serverMessage = isErrorPayload(payload) ? payload['error'] : undefined;
  const suffix = typeof serverMessage === 'string' ? `: ${serverMessage}` : '.';
  return error.status >= 500
    ? `El backend no pudo completar la simulación (HTTP ${error.status})${suffix}`
    : `El backend rechazó la simulación (HTTP ${error.status})${suffix}`;
}

@Injectable({ providedIn: 'root' })
export class SimulationService {

  private readonly http = inject(HttpClient);

  // ── Estado interno ──────────────────────────────────────────────────────────
  private simulations        = signal<Simulation[]>([]);
  private simulationSummaries = signal<AvailableSimulationSummary[]>([]);
  private selectedSimulationId = signal<string | null>(null);
  private selectionRequestVersion = 0;
  private rsrpThreshold      = signal<number>(-140);
  private selectedPoint      = signal<CoveragePoint | null>(null);
  readonly loading           = signal<boolean>(false);
  readonly deletingSimulationId = signal<string | null>(null);
  readonly error             = signal<string | null>(null);
  readonly simulationRunning = signal<boolean>(false);
  readonly simulationError   = signal<string | null>(null);
  readonly placingTransmitter = signal<boolean>(false);
  readonly pendingLocation   = signal<Location | null>(null);
  readonly terrainExtent     = signal<TerrainExtent | null>(null);
  readonly terrainLoading    = signal<boolean>(false);
  readonly terrainError      = signal<string | null>(null);

  // ── Computed ────────────────────────────────────────────────────────────────
  readonly availableSimulations = computed(() => this.simulationSummaries());
  readonly validAvailableSimulations = computed(() =>
    this.simulationSummaries().filter(simulation => simulation.valid)
  );

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
    if (!simulation || simulation.coverage_points.length === 0) return null;

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
      const available = summaries.map(summary => ({
        simulation_id: summary.id,
        name: summary.name,
        created_at: summary.createdAt,
        metadata: summary.metadata,
        valid: summary.valid === true && summary.metadata !== null,
        error: summary.valid === true && summary.metadata !== null
          ? null
          : summary.error ?? 'El backend no devolvió un resumen válido; actualiza Spring Boot.'
      }));
      this.simulationSummaries.set(available);
      this.simulations.set([]);
      this.selectedSimulationId.set(null);
      this.selectionRequestVersion++;

      const firstValid = available.find(simulation => simulation.valid);
      if (firstValid) {
        await this.selectSimulation(firstValid.simulation_id);
      }
    } catch (e) {
      this.error.set('No se pudo conectar con el backend. Asegúrate de que Spring Boot está en localhost:8080.');
      console.error('[SimulationService] Error cargando simulaciones:', e);
    } finally {
      this.loading.set(false);
    }
  }

  async loadTerrainExtent(): Promise<void> {
    this.terrainLoading.set(true);
    this.terrainError.set(null);
    try {
      const extent = await firstValueFrom(
        this.http.get<TerrainExtent>(`${API_ROOT}/terrain/extent`)
      );
      this.terrainExtent.set(extent);
    } catch (error) {
      this.terrainExtent.set(null);
      if (error instanceof HttpErrorResponse) {
        const detail = isErrorPayload(error.error) ? error.error['detail'] : undefined;
        if (error.status === 503) {
          this.terrainError.set(typeof detail === 'string'
            ? `El raster de terreno no está disponible: ${detail}`
            : 'El raster de terreno está ausente o no se puede leer.');
        } else if (error.status === 0) {
          this.terrainError.set('No se pudo consultar la extensión del terreno. Comprueba que el backend esté disponible.');
        } else {
          this.terrainError.set(typeof detail === 'string'
            ? `No se pudo consultar la extensión del terreno: ${detail}`
            : `No se pudo consultar la extensión del terreno (HTTP ${error.status}).`);
        }
      } else {
        this.terrainError.set('Ocurrió un error inesperado al consultar la extensión del terreno.');
      }
      console.error('[SimulationService] Error consultando la extensión del terreno:', error);
    } finally {
      this.terrainLoading.set(false);
    }
  }

  /**
   * Selecciona una simulación y carga sus coveragePoints desde el backend.
   */
  async selectSimulation(id: string): Promise<void> {
    const requestVersion = ++this.selectionRequestVersion;
    this.pendingLocation.set(null);
    this.placingTransmitter.set(false);
    const summary = this.simulationSummaries().find(simulation => simulation.simulation_id === id);
    if (!summary?.valid) {
      this.selectedSimulationId.set(null);
      this.selectedPoint.set(null);
      this.loading.set(false);
      if (summary?.error) this.error.set(summary.error);
      return;
    }

    this.selectedSimulationId.set(id);
    this.selectedPoint.set(null);
    this.error.set(null);

    // Si ya tiene puntos cargados, no volvemos a pedir
    const existing = this.simulations().find(s => s.simulation_id === id);
    if (existing && existing.coverage_points.length > 0) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const full = await firstValueFrom(
        this.http.get<ApiSimulation>(`${API_BASE}/${id}`)
      );
      if (requestVersion !== this.selectionRequestVersion || this.selectedSimulationId() !== id) return;
      const mapped = apiToSimulation(full);
      this.simulations.update(list =>
        [mapped, ...list.filter(s => s.simulation_id !== id)]
      );
    } catch (e) {
      if (requestVersion === this.selectionRequestVersion && this.selectedSimulationId() === id) {
        this.simulations.update(list => list.filter(simulation => simulation.simulation_id !== id));
        this.selectedSimulationId.set(null);
        this.error.set(`Error cargando simulación ${id}.`);
        console.error('[SimulationService] Error cargando detalle:', e);
      }
    } finally {
      if (requestVersion === this.selectionRequestVersion) this.loading.set(false);
    }
  }

  async simulate(request: CreateSimulationRequest): Promise<void> {
    if (this.simulationRunning()) return;
    this.simulationRunning.set(true);
    this.simulationError.set(null);
    this.placingTransmitter.set(false);
    try {
      const response = await firstValueFrom(
        this.http.post<ApiSimulation>(API_BASE, request)
      );
      const simulation = apiToSimulation(response);
      this.simulations.update(list => [
        simulation,
        ...list.filter(item => item.simulation_id !== simulation.simulation_id)
      ]);
      this.simulationSummaries.update(list => [
        {
          simulation_id: simulation.simulation_id,
          name: response.name,
          created_at: response.createdAt,
          metadata: response.metadata,
          valid: true,
          error: null
        },
        ...list.filter(item => item.simulation_id !== simulation.simulation_id)
      ]);
      this.selectionRequestVersion++;
      this.selectedSimulationId.set(simulation.simulation_id);
      this.pendingLocation.set(null);
      this.selectedPoint.set(null);
    } catch (error) {
      this.simulationError.set(simulationErrorMessage(error));
      console.error('[SimulationService] Error creando simulación:', error);
    } finally {
      this.simulationRunning.set(false);
    }
  }

  async deleteSimulation(id: string): Promise<string | null> {
    if (this.deletingSimulationId()) {
      throw new Error('Ya hay una simulación eliminándose.');
    }

    this.deletingSimulationId.set(id);
    try {
      await firstValueFrom(
        this.http.delete<void>(`${API_BASE}/${encodeURIComponent(id)}`)
      );

      const remaining = this.simulationSummaries().filter(
        simulation => simulation.simulation_id !== id
      );
      const currentId = this.selectedSimulationId();
      const nextId = remaining.some(simulation => simulation.valid && simulation.simulation_id === currentId)
        ? currentId
        : remaining.find(simulation => simulation.valid)?.simulation_id ?? null;

      this.simulationSummaries.set(remaining);
      this.simulations.update(list => list.filter(simulation => simulation.simulation_id !== id));
      if (nextId !== currentId) {
        this.selectionRequestVersion++;
        this.selectedSimulationId.set(nextId);
        this.selectedPoint.set(null);
        if (nextId) await this.selectSimulation(nextId);
      }

      return nextId;
    } finally {
      this.deletingSimulationId.set(null);
    }
  }

  startTransmitterPlacement(): void {
    this.simulationError.set(null);
    this.placingTransmitter.set(true);
  }

  cancelTransmitterPlacement(): void {
    this.placingTransmitter.set(false);
  }

  setTransmitterLocation(location: Location): void {
    this.setDraftLocation(location);
    this.placingTransmitter.set(false);
  }

  setDraftLocation(location: Location): void {
    this.pendingLocation.set(location);
  }

  // ── Acciones síncronas ──────────────────────────────────────────────────────

  setRsrpThreshold(value: number): void {
    this.rsrpThreshold.set(value);
  }

  selectPoint(point: CoveragePoint | null): void {
    this.selectedPoint.set(point);
  }

  getRsrpLevel(rsrp: number): typeof RSRP_LEVELS[0] {
    return RSRP_LEVELS.find(level => rsrpInRange(rsrp, level.min, level.max)) || RSRP_LEVELS[3];
  }

  normalizeRsrp(rsrp: number): number {
    return Math.max(0, Math.min(1, (rsrp + 140) / 100));
  }
}
