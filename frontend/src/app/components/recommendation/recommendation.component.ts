import { Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecommendationRequest, RecommendationService } from '../../services/recommendation.service';
import { SimulationService } from '../../services/simulation.service';

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [FormsModule],
  template: `
    <button type="button" class="open" (click)="togglePanel()">
      Recomendación de emplazamientos
    </button>
    @if (open) {
      <section class="panel" aria-label="Recomendación de emplazamientos">
        <h2>Recomendación de emplazamientos</h2>
        <p>Predicciones del motor, no mediciones;
          proxy normalizado, no SS-RSRP. La selección es greedy, no un óptimo garantizado.</p>
        <label>Área objetivo
          <select [(ngModel)]="mode" (ngModelChange)="changeMode()">
            <option value="square">Cuadrada</option>
            <option value="polygon">Polígono dibujado</option>
          </select>
        </label>
        @if (mode === 'square') {
          <button type="button" (click)="placeCenter()">
            {{ recommendation.placing() ? 'Selecciona el centro en el mapa…' : 'Elegir centro en el mapa' }}
          </button>
        } @else {
          <button type="button" (click)="startDrawing()">Dibujar nuevo polígono</button>
          <button type="button" [disabled]="!recommendation.drawing() || recommendation.polygon().length < 3"
            (click)="recommendation.drawing.set(false)">Cerrar polígono</button>
          <button type="button" [disabled]="!recommendation.drawing() || recommendation.polygon().length === 0"
            (click)="removeVertex()">Deshacer último vértice</button>
          <p role="status">{{ recommendation.drawing() ? 'Haz clic en el mapa para añadir vértices.' : 'Polígono cerrado.' }}
            Vértices: {{ recommendation.polygon().length }} / 100.</p>
        }
        <form #form="ngForm" (ngSubmit)="calculate()">
          <div class="fields">
            @if (mode === 'square') {
              <label>Latitud centro <input name="lat" type="number" step="any" min="-85" max="85" required [(ngModel)]="request.latitude" (ngModelChange)="changed()"></label>
              <label>Longitud centro <input name="lon" type="number" step="any" min="-180" max="180" required [(ngModel)]="request.longitude" (ngModelChange)="changed()"></label>
              <label>Lado (km) <input name="area" type="number" step="any" min="0.1" max="5" required [(ngModel)]="request.areaKm" (ngModelChange)="changed()"></label>
            }
            <label>Nodos máximos <input name="nodes" type="number" step="1" min="1" max="10" required [(ngModel)]="request.nodes" (ngModelChange)="changed()"></label>
            <label>Candidatos por lado <input name="candidates" type="number" step="1" min="2" max="8" required [(ngModel)]="request.candidateSide" (ngModelChange)="changed()"></label>
            <label>Objetivos por lado <input name="targets" type="number" step="1" min="2" max="15" required [(ngModel)]="request.targetSide" (ngModelChange)="changed()"></label>
            <label>Umbral proxy (dBm) <input name="threshold" type="number" step="any" min="-139" max="-40" required [(ngModel)]="request.thresholdDbm" (ngModelChange)="changed()"></label>
            <label>Frecuencia (GHz) <input name="frequency" type="number" step="any" min="0.4" max="7.125" required [(ngModel)]="request.frequencyGHz" (ngModelChange)="changed()"></label>
            <label>Altura TX (m) <input name="txHeight" type="number" step="any" min="1" max="300" required [(ngModel)]="request.txHeightM" (ngModelChange)="changed()"></label>
            <label>Altura RX (m) <input name="rxHeight" type="number" step="any" min="0.5" max="10" required [(ngModel)]="request.rxHeightM" (ngModelChange)="changed()"></label>
            <label>Potencia TX (dBm) <input name="power" type="number" step="any" min="0" max="60" required [(ngModel)]="request.txPowerDbm" (ngModelChange)="changed()"></label>
            <label>Ganancia TX (dBi) <input name="gain" type="number" step="any" min="0" max="50" required [(ngModel)]="request.txGainDbi" (ngModelChange)="changed()"></label>
            <label>Cable (dB) <input name="cable" type="number" step="any" min="0" max="30" required [(ngModel)]="request.cableLossDb" (ngModelChange)="changed()"></label>
          </div>
          <p>Máximo 8² candidatos, 15² objetivos, 14.400 enlaces y 1.500.000 muestras estimadas de perfil; paso 100 m.</p>
          <button type="submit" [disabled]="!form.valid || recommendation.running() || (mode === 'polygon' && (recommendation.drawing() || recommendation.polygon().length < 3))">
            {{ recommendation.running() ? 'Calculando…' : 'Calcular recomendación' }}
          </button>
        </form>
        @if (recommendation.error(); as error) { <p role="alert">{{ error }}</p> }
        @if (recommendation.result(); as result) {
          <p>{{ result.model }} · {{ result.candidateCount }} candidatos · {{ result.targetCount }} objetivos ·
            {{ result.linkCount }} enlaces · máximo estimado {{ result.maxProfileSamples }} muestras</p>
          <p>Cobertura: {{ result.coveredTargets }} / {{ result.targetCount }} puntos objetivo.
            Nodos seleccionados: {{ result.sites.length }} / {{ result.request.nodes }}.</p>
          @for (site of result.sites; track $index) {
            <p>{{ $index + 1 }}: {{ site.latitude.toFixed(5) }}, {{ site.longitude.toFixed(5) }} ·
              +{{ site.newlyCovered }} puntos · acumulado {{ site.cumulativeCovered }}</p>
          }
          @if (result.sites.length < result.request.nodes) { <p>No quedan candidatos que aporten cobertura adicional.</p> }
        }
      </section>
    }
  `,
  styles: [`
    .open { position:absolute; z-index:1500; left:70px; top:16px; background:var(--bg-secondary);
      color:var(--text-primary); border:1px solid var(--border); border-radius:3px; cursor:pointer; }
    .panel { position:absolute; z-index:3000; left:16px; top:55px; width:min(440px, calc(100% - 32px));
      max-height:calc(100% - 70px); overflow:auto; box-sizing:border-box; background:#141a22;
      color:#f0f3f6; padding:16px; border:1px solid #6c7889; }
    .fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    label { display:flex; flex-direction:column; font-size:12px; }
    input { width:100%; box-sizing:border-box; } button,input { padding:5px; }
    p { font-size:12px; } [role=alert] { color:#ff9c9c; }
  `]
})
export class RecommendationComponent {
  readonly recommendation = inject(RecommendationService);
  private readonly simulation = inject(SimulationService);
  open = false;
  mode: 'square' | 'polygon' = 'square';
  request: RecommendationRequest = {
    latitude: 40.2897, longitude: -3.8244, areaKm: 1, candidateSide: 4, targetSide: 8,
    nodes: 2, thresholdDbm: -100, frequencyGHz: 3.5, txHeightM: 30, rxHeightM: 1.5,
    txPowerDbm: 40, txGainDbi: 15, cableLossDb: 2
  };
  constructor() {
    effect(() => {
      const center = this.recommendation.center();
      if (center) this.request = { ...this.request, ...center };
    });
  }
  placeCenter(): void {
    this.simulation.cancelTransmitterPlacement();
    this.recommendation.drawing.set(false);
    this.recommendation.placing.set(true);
  }
  togglePanel(): void {
    this.open = !this.open;
    this.recommendation.placing.set(false);
    if (!this.open) this.recommendation.drawing.set(false);
  }
  changeMode(): void {
    this.recommendation.placing.set(false);
    this.recommendation.drawing.set(false);
    this.recommendation.polygon.set([]);
    this.recommendation.clear();
  }
  startDrawing(): void {
    this.simulation.cancelTransmitterPlacement();
    this.recommendation.startDrawing();
  }
  removeVertex(): void {
    this.recommendation.clear();
    this.recommendation.polygon.update(points => points.slice(0, -1));
  }
  changed(): void { this.recommendation.clear(); }
  calculate(): void {
    void this.recommendation.calculate({
      ...this.request,
      polygon: this.mode === 'polygon' ? [...this.recommendation.polygon()] : undefined
    });
  }
}
