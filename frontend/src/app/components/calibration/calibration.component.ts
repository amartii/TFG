import { Component, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SimulationService } from '../../services/simulation.service';

interface Match {
  observationIndex: number; split: string; predictionLatitude: number; predictionLongitude: number;
  distanceM: number; predictionDbm: number; observationDbm: number; correctedDbm: number;
  residualBeforeDb: number; residualAfterDb: number;
}
interface Calibration {
  id: string; createdAt: string; predictionSha256: string; predictionVersion: string;
  predictionMatches?: boolean; offsetDb: number; maxDistanceM: number;
  holdoutMetrics: { count: number; biasBeforeDb: number; biasAfterDb: number; rmseBeforeDb: number; rmseAfterDb: number };
  accepted: Match[]; rejected: { observationIndex: number; reason: string }[];
  originalObservations: unknown[];
}

@Component({
  selector: 'app-calibration',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <button class="open" (click)="open.set(!open())">Observaciones y calibración</button>
    @if (open()) {
      <section class="panel" aria-label="Observaciones y calibración">
        <button class="close" (click)="open.set(false)" aria-label="Cerrar">×</button>
        <h2>Observaciones y calibración</h2>
        <p>Proxy de potencia del prototipo, no SS-RSRP.</p>
        @if (simulationService.currentSimulation(); as simulation) {
          <p>Escenario: {{ simulation.metadata.scenario_name || simulation.simulation_id }}</p>
          <label>Importar JSON <input type="file" accept=".json,application/json" (change)="importFile($event)"></label>
          <button (click)="refresh()" [disabled]="busy()">Actualizar resultados</button>
          @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
          @if (busy()) { <p role="status">Procesando…</p> }
          @for (item of calibrations(); track item.id) {
            <button (click)="selected.set(item); page.set(0)">
              {{ item.createdAt }} · offset {{ item.offsetDb | number:'1.2-2' }} dB
            </button>
          }
          @if (selected(); as result) {
            <h3>Resultado {{ result.id }}</h3>
            <p>Versión {{ result.predictionVersion }} · SHA-256 {{ result.predictionSha256 }}</p>
            @if (result.predictionMatches === false) {
              <p class="error">La predicción actual ha cambiado; solo se muestran los puntos históricos emparejados.</p>
            }
            <p>Ajuste: {{ result.offsetDb | number:'1.3-3' }} dB · distancia máxima {{ result.maxDistanceM | number:'1.1-1' }} m</p>
            <p>Reserva ({{ result.holdoutMetrics.count }}): sesgo {{ result.holdoutMetrics.biasBeforeDb | number:'1.3-3' }} → {{ result.holdoutMetrics.biasAfterDb | number:'1.3-3' }} dB;
              RMSE {{ result.holdoutMetrics.rmseBeforeDb | number:'1.3-3' }} → {{ result.holdoutMetrics.rmseAfterDb | number:'1.3-3' }} dB.</p>
            <h3>Puntos y residuos</h3>
            <div class="table-wrap"><table><thead><tr><th>Fila</th><th>Conjunto</th><th>Lat, lon predicción</th><th>Distancia m</th><th>Original</th><th>Observado</th><th>Corregido</th><th>Residuo antes / después</th></tr></thead>
              <tbody>@for (point of result.accepted; track point.observationIndex) {
                <tr><td>{{ point.observationIndex + 1 }}</td><td>{{ point.split }}</td>
                <td>{{ point.predictionLatitude | number:'1.5-5' }}, {{ point.predictionLongitude | number:'1.5-5' }}</td>
                <td>{{ point.distanceM | number:'1.1-1' }}</td><td>{{ point.predictionDbm | number:'1.2-2' }}</td>
                <td>{{ point.observationDbm | number:'1.2-2' }}</td><td>{{ point.correctedDbm | number:'1.2-2' }}</td>
                <td>{{ point.residualBeforeDb | number:'1.2-2' }} / {{ point.residualAfterDb | number:'1.2-2' }}</td></tr>
              }</tbody></table></div>
            <h3>Descartes ({{ result.rejected.length }})</h3>
            @for (item of result.rejected; track item.observationIndex) { <p>Fila {{ item.observationIndex + 1 }}: {{ item.reason }}</p> }
            <details><summary>Observaciones originales y procedencia</summary><pre>{{ originalJson(result) }}</pre></details>
            @if (result.predictionMatches !== false) {
              <h3>Vista corregida de la malla (dBm)</h3>
              <p>La predicción original permanece sin cambios.</p>
              <div class="table-wrap"><table><thead><tr><th>Latitud</th><th>Longitud</th><th>Original</th><th>Corregida</th></tr></thead>
                <tbody>@for (point of simulation.coverage_points.slice(page() * 100, page() * 100 + 100); track $index) {
                  <tr><td>{{ point.latitude | number:'1.5-5' }}</td><td>{{ point.longitude | number:'1.5-5' }}</td>
                  <td>{{ point.rsrp_dbm | number:'1.2-2' }}</td><td>{{ point.rsrp_dbm + result.offsetDb | number:'1.2-2' }}</td></tr>
                }</tbody></table></div>
              <button [disabled]="page() === 0" (click)="page.set(page() - 1)">Anterior</button>
              <span> Página {{ page() + 1 }} </span>
              <button [disabled]="(page() + 1) * 100 >= simulation.coverage_points.length" (click)="page.set(page() + 1)">Siguiente</button>
            }
          }
        } @else { <p>Selecciona primero un escenario guardado.</p> }
      </section>
    }
  `,
  styles: [`
    .open { position:absolute; z-index:1500; right:16px; top:92px; background:var(--bg-secondary);
      color:var(--text-primary); border:1px solid var(--border); border-radius:3px; cursor:pointer; }
    .panel { position:absolute; z-index:3000; inset:12px; overflow:auto; background:#141a22; color:#f0f3f6; padding:20px; border:1px solid #6c7889; }
    button, input { margin:4px; padding:6px; } .close { float:right; }
    .error { color:#ff9c9c; } .table-wrap { overflow:auto; }
    table { border-collapse:collapse; font-size:12px; } th,td { border:1px solid #6c7889; padding:5px; white-space:nowrap; }
    pre { white-space:pre-wrap; overflow-wrap:anywhere; }
  `]
})
export class CalibrationComponent {
  readonly simulationService = inject(SimulationService);
  private readonly http = inject(HttpClient);
  readonly open = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly calibrations = signal<Calibration[]>([]);
  readonly selected = signal<Calibration | null>(null);
  readonly page = signal(0);
  private request = 0;
  private importRequest = 0;

  constructor() {
    effect(() => {
      const id = this.simulationService.currentSimulation()?.simulation_id;
      this.calibrations.set([]); this.selected.set(null); this.error.set(null);
      this.request++;
      this.importRequest++;
      this.busy.set(false);
      if (id) void this.load(id);
    });
  }
  private url(id: string): string { return `http://localhost:8080/api/simulations/${encodeURIComponent(id)}/calibrations`; }
  private async load(id: string): Promise<boolean> {
    const request = ++this.request;
    try {
      const results = await firstValueFrom(this.http.get<Calibration[]>(this.url(id)));
      if (request !== this.request || this.simulationService.currentSimulation()?.simulation_id !== id) return false;
      this.calibrations.set(results);
      const selectedId = this.selected()?.id;
      if (selectedId) {
        const selected = results.find(item => item.id === selectedId) ?? null;
        this.selected.set(selected);
        if (!selected) this.page.set(0);
      }
      this.error.set(null);
      return true;
    } catch (error) {
      if (request === this.request && this.simulationService.currentSimulation()?.simulation_id === id) {
        this.error.set(this.message(error));
      }
      return false;
    }
  }
  async refresh(): Promise<void> {
    const id = this.simulationService.currentSimulation()?.simulation_id;
    if (id) await this.load(id);
  }
  async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.simulationService.currentSimulation()?.simulation_id;
    if (!file || !id) return;
    const request = ++this.importRequest;
    this.request++;
    input.value = '';
    this.busy.set(true); this.error.set(null);
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!this.isCurrentImport(request, id)) return;
      const result = await firstValueFrom(this.http.post<Calibration>(this.url(id), data));
      if (this.isCurrentImport(request, id)) {
        const loaded = await this.load(id);
        if (loaded && this.isCurrentImport(request, id)) {
          this.selected.set(this.calibrations().find(item => item.id === result.id) ?? null);
          this.page.set(0);
        }
      }
    } catch (error) {
      if (this.isCurrentImport(request, id)) this.error.set(this.message(error));
    } finally {
      if (request === this.importRequest) this.busy.set(false);
    }
  }
  private isCurrentImport(request: number, id: string): boolean {
    return request === this.importRequest && this.simulationService.currentSimulation()?.simulation_id === id;
  }
  originalJson(result: Calibration): string { return JSON.stringify(result.originalObservations, null, 2); }
  private message(error: unknown): string {
    if (error instanceof SyntaxError) return 'El archivo no contiene JSON válido.';
    if (error instanceof HttpErrorResponse) return error.error?.detail || `No se pudo completar la petición (HTTP ${error.status}).`;
    return 'No se pudo leer o importar el archivo.';
  }
}
