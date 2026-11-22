import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SimulationService } from '../../services/simulation.service';

interface LinkProfileSample {
  distanceM: number;
  terrainElevationM: number;
  effectiveTerrainHeightM: number;
  lineOfSightHeightM: number;
  fresnelRadiusM: number;
  firstFresnelLowerM: number;
  firstFresnelUpperM: number;
}

interface LinkProfile {
  distanceM: number;
  frequencyGHz: number;
  wavelengthM: number;
  firstFresnelRadiusMaxM: number;
  samples: LinkProfileSample[];
}

type PlotLine = 'terrain' | 'los' | 'upper' | 'lower';

@Component({
  selector: 'app-link-profile',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    <button class="open" (click)="open.set(!open())">Perfil de enlace / Fresnel</button>
    @if (open()) {
      <section class="panel" aria-label="Perfil de enlace y zona de Fresnel">
        <button class="close" (click)="open.set(false)" aria-label="Cerrar">×</button>
        <h2>Perfil de enlace y primera zona de Fresnel</h2>
        <p>Perfil del raster de terreno, no una medición. No incluye clutter ni datos reales de usos del suelo.</p>
        @if (simulationService.currentSimulation(); as simulation) {
          <p>Escenario: {{ simulation.metadata.scenario_name || simulation.simulation_id }}</p>
          <form (ngSubmit)="calculate(simulation.simulation_id)">
            <label>Latitud RX (°)
              <input name="receiverLatitude" type="number" [(ngModel)]="receiverLatitude" (ngModelChange)="invalidate()" min="-90" max="90" step="any" required>
            </label>
            <label>Longitud RX (°)
              <input name="receiverLongitude" type="number" [(ngModel)]="receiverLongitude" (ngModelChange)="invalidate()" min="-180" max="180" step="any" required>
            </label>
            <button type="submit" [disabled]="busy()">Calcular perfil</button>
          </form>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          @if (busy()) { <p role="status">Calculando perfil…</p> }
          @if (profile(); as result) {
            <p>Distancia {{ result.distanceM / 1000 | number:'1.2-2' }} km · {{ result.frequencyGHz }} GHz ·
              λ {{ result.wavelengthM | number:'1.3-3' }} m · radio máximo F1 {{ result.firstFresnelRadiusMaxM | number:'1.2-2' }} m</p>
            <div class="legend"><span>Terreno</span><span>Trayecto TX–RX</span><span>F1 ± radio</span></div>
            <svg class="plot" viewBox="0 0 800 280" role="img" aria-label="Perfil del terreno, línea de vista y primera zona de Fresnel">
              <polygon [attr.points]="chartArea()"></polygon>
              <polyline class="terrain" [attr.points]="chartPoints('terrain')"></polyline>
              <polyline class="los" [attr.points]="chartPoints('los')"></polyline>
              <polyline class="fresnel" [attr.points]="chartPoints('upper')"></polyline>
              <polyline class="fresnel" [attr.points]="chartPoints('lower')"></polyline>
              <text x="400" y="270">{{ result.distanceM / 1000 | number:'1.2-2' }} km</text>
            </svg>
            <div class="table-wrap"><table><thead><tr><th>Distancia (m)</th><th>Terreno (m)</th><th>Trayecto (m)</th><th>Radio F1 (m)</th><th>Despeje inferior (m)</th></tr></thead>
              <tbody>@for (point of result.samples; track $index) {
                <tr><td>{{ point.distanceM | number:'1.0-0' }}</td>
                <td>{{ point.effectiveTerrainHeightM | number:'1.1-1' }}</td>
                <td>{{ point.lineOfSightHeightM | number:'1.1-1' }}</td>
                <td>{{ point.fresnelRadiusM | number:'1.1-1' }}</td>
                <td>{{ point.firstFresnelLowerM - point.effectiveTerrainHeightM | number:'1.1-1' }}</td></tr>
              }</tbody></table></div>
          }
        } @else { <p>Selecciona primero un escenario guardado.</p> }
      </section>
    }
  `,
  styles: [`
    .open { position:absolute; z-index:1500; right:16px; top:130px; background:var(--bg-secondary);
      color:var(--text-primary); border:1px solid var(--border); border-radius:3px; cursor:pointer; }
    .panel { position:absolute; z-index:3000; inset:12px; overflow:auto; background:#141a22; color:#f0f3f6; padding:20px; border:1px solid #6c7889; }
    button,input { margin:4px; padding:6px; } .close { float:right; }
    form { display:flex; flex-wrap:wrap; align-items:end; gap:8px; }
    form label { display:grid; gap:4px; }
    .error { color:#ff9c9c; }
    .legend { display:flex; gap:18px; font-size:12px; }
    .legend span:nth-child(1) { color:#65d58b; } .legend span:nth-child(2) { color:#fff; } .legend span:nth-child(3) { color:#62b7ff; }
    .plot { display:block; width:100%; min-height:180px; background:#0b1118; margin:12px 0; }
    polyline { fill:none; vector-effect:non-scaling-stroke; }
    polygon { fill:rgba(70,160,230,.18); stroke:none; }
    .terrain { stroke:#65d58b; stroke-width:2; } .los { stroke:#fff; stroke-width:2; }
    .fresnel { stroke:#62b7ff; stroke-width:1.5; stroke-dasharray:6 4; }
    text { fill:#c4cbd5; font-size:12px; text-anchor:middle; }
    .table-wrap { max-height:240px; overflow:auto; }
    table { border-collapse:collapse; font-size:12px; } th,td { border:1px solid #6c7889; padding:5px; white-space:nowrap; }
  `]
})
export class LinkProfileComponent {
  readonly simulationService = inject(SimulationService);
  private readonly http = inject(HttpClient);
  readonly open = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly profile = signal<LinkProfile | null>(null);
  receiverLatitude = 40.29;
  receiverLongitude = -3.82;
  private request = 0;
  private readonly heightRange = computed(() => {
    const points = this.profile()?.samples ?? [];
    const values = points.flatMap(point => [
      point.effectiveTerrainHeightM, point.lineOfSightHeightM,
      point.firstFresnelLowerM, point.firstFresnelUpperM
    ]);
    return values.length ? [Math.min(...values), Math.max(...values)] : [0, 1];
  });

  constructor() {
    effect(() => {
      const location = this.simulationService.currentSimulation()?.metadata.tx_location;
      this.profile.set(null);
      this.error.set(null);
      this.request++;
      this.busy.set(false);
      if (location) {
        this.receiverLatitude = location.latitude + 0.001;
        this.receiverLongitude = location.longitude;
      }
    });
  }

  async calculate(simulationId: string): Promise<void> {
    const request = ++this.request;
    this.busy.set(true);
    this.error.set(null);
    this.profile.set(null);
    try {
      const result = await firstValueFrom(this.http.post<LinkProfile>(
        `http://localhost:8080/api/simulations/${encodeURIComponent(simulationId)}/link-profile`,
        {receiverLatitude: this.receiverLatitude, receiverLongitude: this.receiverLongitude}
      ));
      if (request === this.request) this.profile.set(result);
    } catch (error) {
      if (request === this.request) this.error.set(this.errorMessage(error));
    } finally {
      if (request === this.request) this.busy.set(false);
    }
  }

  invalidate(): void {
    this.request++;
    this.busy.set(false);
    this.profile.set(null);
    this.error.set(null);
  }

  chartPoints(line: PlotLine): string {
    const points = this.profile()?.samples ?? [];
    if (!points.length) return '';
    return points.map((point, index) => `${this.x(index, points.length)},${this.y(this.value(point, line))}`).join(' ');
  }

  chartArea(): string {
    const points = this.profile()?.samples ?? [];
    if (!points.length) return '';
    const upper = points.map((point, index) => `${this.x(index, points.length)},${this.y(point.firstFresnelUpperM)}`);
    const lower = points.map((point, index) => `${this.x(index, points.length)},${this.y(point.firstFresnelLowerM)}`).reverse();
    return [...upper, ...lower].join(' ');
  }

  private value(point: LinkProfileSample, line: PlotLine): number {
    if (line === 'terrain') return point.effectiveTerrainHeightM;
    if (line === 'upper') return point.firstFresnelUpperM;
    if (line === 'lower') return point.firstFresnelLowerM;
    return point.lineOfSightHeightM;
  }

  private x(index: number, count: number): number { return 30 + index * 740 / Math.max(1, count - 1); }
  private y(value: number): number {
    const [min, max] = this.heightRange();
    return 245 - (value - min) * 210 / Math.max(1, max - min);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.detail || `No se pudo calcular el perfil (HTTP ${error.status}).`;
    }
    return 'No se pudo calcular el perfil de enlace.';
  }
}
