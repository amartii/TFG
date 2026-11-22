import { Component, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../../services/simulation.service';
import { ComparisonService } from '../../services/comparison.service';
import { RecommendationService } from '../../services/recommendation.service';
import { CreateSimulationRequest } from '../../models/simulation.model';

@Component({
  selector: 'app-simulation-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="config">
      <div class="section-header">
        <span class="section-dot"></span>
        <h3 class="section-title">Simulación bajo demanda</h3>
      </div>

      <form #simulationForm="ngForm" (ngSubmit)="simulate()">
       <fieldset class="config__form" [disabled]="simulationService.simulationRunning() || simulationService.loading()
         || simulationService.deletingSimulationId() !== null">
        <p class="form-hint">Coloca la antena, ajusta los parámetros y calcula la cobertura.</p>
        <label class="field field--wide">
          <span>Nombre</span>
          <input name="name" [(ngModel)]="form.name" required maxlength="100" />
        </label>

        @let tx = form.transmitters[0];
        <div class="fields">
          <label class="field">
            <span>Latitud TX (°)</span>
            <input name="latitude" type="number" [(ngModel)]="tx.latitude"
              (ngModelChange)="updateDraftLocation()"
              min="-90" max="90" step="any" required />
          </label>
          <label class="field">
            <span>Longitud TX (°)</span>
            <input name="longitude" type="number" [(ngModel)]="tx.longitude"
              (ngModelChange)="updateDraftLocation()"
              min="-180" max="180" step="any" required />
          </label>
          <label class="field">
            <span>Altura TX (m)</span>
            <input name="txHeightM" type="number" [(ngModel)]="tx.txHeightM"
              min="1" max="300" step="any" required />
          </label>
          <label class="field">
            <span>Ptx (dBm)</span>
            <input name="txPowerDbm" type="number" [(ngModel)]="tx.txPowerDbm"
              min="0" max="60" step="any" required />
          </label>
        </div>
        <button class="place-btn" type="button" [disabled]="simulationService.simulationRunning() || simulationService.loading()
          || simulationService.deletingSimulationId() !== null || comparisonService.active()" (click)="selectLocationOnMap()">
          {{ simulationService.placingTransmitter() ? 'Cancelar selección en el mapa' : 'Colocar o mover antena en el mapa' }}
        </button>
        <div class="fields">
          <label class="field">
            <span>Frecuencia (GHz)</span>
            <input name="frequencyGHz" type="number" [(ngModel)]="form.frequencyGHz"
              min="0.4" max="7.125" step="any" required />
          </label>
          <label class="field">
            <span>Lado del área (km)</span>
            <input name="areaKm" type="number" [(ngModel)]="form.areaKm"
              min="0.1" max="50" step="any" required />
          </label>
          <label class="field">
            <span>Espaciado (m)</span>
            <input name="gridSpacingM" type="number" [(ngModel)]="form.gridSpacingM"
              min="10" max="10000" step="any" required />
          </label>
        </div>

        <details class="advanced">
          <summary>Opciones radio y receptor</summary>
          <div class="fields">
            <label class="field">
              <span>Ganancia TX (dBi)</span>
              <input name="txGainDbi" type="number" [(ngModel)]="tx.txGainDbi" min="0" max="50" step="any" required />
            </label>
            <label class="field">
              <span>Altura RX (m)</span>
              <input name="rxHeightM" type="number" [(ngModel)]="form.rxHeightM" min="0.5" max="10" step="any" required />
            </label>
            <label class="field">
              <span>Pérdidas de cable (dB)</span>
              <input name="cableLossDb" type="number" [(ngModel)]="form.cableLossDb" min="0" max="30" step="any" required />
            </label>
            <label class="field">
              <span>Pérdida manual de clutter (dB)</span>
              <input name="clutterLossDb" type="number" [(ngModel)]="form.clutterLossDb" min="0" max="40" step="any" placeholder="Desactivada" />
            </label>
            <label class="field field--check">
              <span>Patrón direccional aproximado</span>
              <input name="directionalPatternEnabled" type="checkbox"
                [ngModel]="directionalEnabled" (ngModelChange)="toggleDirectionalPattern($event)" />
            </label>
            @if (directionalEnabled) {
              <label class="field">
                <span>Azimut antena (°)</span>
                <input name="antennaAzimuthDeg" type="number" [(ngModel)]="tx.antennaAzimuthDeg" min="0" max="360" step="any" required />
              </label>
              <label class="field">
                <span>Inclinación descendente (°)</span>
                <input name="antennaDowntiltDeg" type="number" [(ngModel)]="tx.antennaDowntiltDeg" min="-90" max="90" step="any" required />
              </label>
            }
          </div>
          <div class="eirp-preview">EIRP: <strong>{{ (tx.txPowerDbm + tx.txGainDbi - form.cableLossDb).toFixed(1) }} dBm</strong></div>
          <p class="form-hint">Azimut 0° = norte; inclinación positiva hacia abajo. Patrón simplificado, no medido. El clutter es una pérdida manual; no representa datos reales de usos del suelo.</p>
        </details>
        @if (comparisonService.active()) {
          <p class="form-hint" role="status">Sal de la comparación para colocar una antena; las vistas A/B no admiten selección de ubicación.</p>
        }
        @if (simulationService.placingTransmitter()) {
          <p class="form-hint" role="status">Selecciona la ubicación del gNodeB en el mapa.</p>
        } @else if (simulationService.pendingLocation() && simulation()) {
          <p class="form-hint" role="status">La cobertura mostrada corresponde al escenario activo. Simula para calcular la posición propuesta.</p>
        }

        @if (terrainWarning; as warning) {
          <p class="form-warning" role="alert">{{ warning }}</p>
        }

        @if (simulationService.simulationError()) {
          <p class="form-error" role="alert">{{ simulationService.simulationError() }}</p>
        }

        @if (simulationForm.form.invalid && simulationForm.form.touched) {
          <p class="form-error" role="alert">Revisa los parámetros, incluidas las opciones radio y receptor.</p>
        }
        <button class="simulate-btn" type="submit"
          [disabled]="!simulationForm.form.valid || simulationService.simulationRunning() || simulationService.loading()
            || simulationService.deletingSimulationId() !== null || simulationService.placingTransmitter() || comparisonService.active()">
          {{ simulationService.simulationRunning() ? 'Calculando cobertura…' : 'Simular' }}
        </button>
       </fieldset>
      </form>
    </section>

    @if (simulation(); as active) {
      <section class="config config__active">
        <div class="section-header">
          <span class="section-dot"></span>
          <h3 class="section-title">Parámetros de la simulación activa</h3>
        </div>
        <div class="config__params">
          <div class="param">
            <span class="param__label">Ptx</span>
            <span class="param__value font-mono">{{ active.metadata.tx_power_dbm }} dBm</span>
          </div>
          <div class="param">
            <span class="param__label">EIRP</span>
            <span class="param__value font-mono">{{ active.metadata.eirp_dbm ?? '—' }} dBm</span>
          </div>
          <div class="param">
            <span class="param__label">Frecuencia</span>
            <span class="param__value font-mono">{{ active.metadata.frequency_ghz }} GHz</span>
          </div>
          <div class="param">
            <span class="param__label">Área · rejilla</span>
            <span class="param__value font-mono">
              {{ active.coverage_area.width_km }} km · {{ active.coverage_area.grid_spacing_m }} m
            </span>
          </div>
          <div class="param">
            <span class="param__label">Modelo</span>
            <span class="param__value">{{ active.metadata.model }}</span>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    @use '../../../styles/variables' as *;

    .config {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;
    }

    .config__form {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
      min-width: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $spacing-sm;
    }

    .field {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 4px;
      color: var(--text-muted);
      font-size: $font-size-xs;
    }

    .field--wide {
      width: 100%;
    }

    .field--check {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      min-height: 32px;
    }

    .field--check input {
      width: auto;
    }

    .advanced {
      color: var(--text-muted);
      font-size: $font-size-xs;
    }

    .advanced summary {
      cursor: pointer;
      color: var(--text-primary);
      padding: 6px 0;
    }

    .advanced .fields,
    .advanced .eirp-preview,
    .advanced .form-hint {
      margin-top: $spacing-sm;
    }

    .field input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      padding: 7px 8px;
      border: 1px solid var(--border);
      border-radius: $border-radius-sm;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font: inherit;
      font-family: $font-mono;
    }

    .field input:focus-visible,
    .place-btn:focus-visible,
    .simulate-btn:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }

    .eirp-preview {
      color: var(--text-muted);
      font-size: $font-size-xs;
    }

    .eirp-preview strong {
      color: var(--text-primary);
      font-family: $font-mono;
    }

    .place-btn,
    .simulate-btn {
      width: 100%;
      padding: 9px 10px;
      border-radius: $border-radius-sm;
      font: inherit;
      font-size: $font-size-sm;
      cursor: pointer;
    }

    .place-btn {
      border: 1px solid var(--border);
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .simulate-btn {
      border: 1px solid var(--accent-primary);
      background: var(--accent-primary);
      color: var(--bg-primary);
      font-weight: $font-weight-semibold;
    }

    .place-btn:disabled,
    .simulate-btn:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .form-hint,
    .form-error {
      margin: 0;
      font-size: $font-size-xs;
    }

    .form-hint {
      color: var(--text-muted);
    }

    .form-error {
      color: #ef4444;
    }

    .form-warning {
      margin: 0;
      color: #b45309;
      font-size: $font-size-xs;
      line-height: 1.4;
    }

    .config__active {
      padding-top: $spacing-md;
      border-top: 1px solid var(--border);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
    }

    .section-dot {
      width: 4px;
      height: 14px;
      border-radius: 2px;
      background: var(--accent-primary);
      flex-shrink: 0;
    }

    .section-title {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .config__params {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }

    .param {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-sm $spacing-md;
      background: var(--bg-tertiary);
      border-radius: $border-radius-md;
      border: 1px solid transparent;
      transition: all $transition-fast;

      &:hover {
        border-color: var(--border);
        background: var(--bg-hover);
      }

      &__label {
        font-size: $font-size-xs;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        flex-shrink: 0;
      }

      &__values {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        min-width: 0;
      }

      &__value {
        font-size: $font-size-sm;
        color: var(--text-primary);
        font-weight: $font-weight-medium;
      }

      &__badge {
        padding: 2px 6px;
        background: rgba($color-accent-secondary, 0.15);
        border-radius: $border-radius-sm;
        font-size: 10px;
        color: $color-accent-secondary;
        white-space: nowrap;
      }
    }
  `]
})
export class SimulationConfigComponent {
  readonly simulationService = inject(SimulationService);
  readonly comparisonService = inject(ComparisonService);
  private readonly recommendation = inject(RecommendationService);

  readonly simulation = computed(() => this.simulationService.currentSimulation());

  get terrainWarning(): string | null {
    const extent = this.simulationService.terrainExtent();
    if (!extent) return null;

    const transmitter = this.form.transmitters[0];
    const { latitude, longitude } = transmitter;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (latitude < extent.southLatitude || latitude > extent.northLatitude
        || longitude < extent.westLongitude || longitude > extent.eastLongitude) {
      return 'La ubicación TX está fuera del raster de terreno; el motor rechazará la simulación.';
    }

    const halfAreaKm = Number(this.form.areaKm) / 2;
    const longitudeScale = Math.cos(latitude * Math.PI / 180);
    if (!Number.isFinite(halfAreaKm) || Math.abs(longitudeScale) < 1e-6) return null;

    const latitudeDelta = halfAreaKm / 111;
    const longitudeDelta = halfAreaKm / (111 * Math.abs(longitudeScale));
    if (latitude - latitudeDelta < extent.southLatitude
        || latitude + latitudeDelta > extent.northLatitude
        || longitude - longitudeDelta < extent.westLongitude
        || longitude + longitudeDelta > extent.eastLongitude) {
      return 'El área solicitada rebasa la extensión del terreno; los perfiles que salgan del raster o caigan en NoData pueden hacer que el motor rechace la simulación.';
    }
    return null;
  }

  directionalEnabled = false;
  form: CreateSimulationRequest = {
    name: 'Nueva simulación',
    frequencyGHz: 3.5,
    rxHeightM: 1.5,
    areaKm: 3,
    gridSpacingM: 50,
    cableLossDb: 2,
    transmitters: [{
      latitude: 40.2897,
      longitude: -3.8244,
      txHeightM: 30,
      txPowerDbm: 40,
      txGainDbi: 15
    }]
  };

  toggleDirectionalPattern(enabled: boolean): void {
    this.directionalEnabled = enabled;
    const tx = this.form.transmitters[0];
    if (enabled) {
      tx.antennaAzimuthDeg = 0;
      tx.antennaDowntiltDeg = 0;
    } else {
      delete tx.antennaAzimuthDeg;
      delete tx.antennaDowntiltDeg;
    }
  }

  constructor() {
    effect(() => {
      const location = this.simulationService.pendingLocation();
      if (location) {
        this.form = {
          ...this.form,
          transmitters: [{ ...this.form.transmitters[0], ...location }]
        };
      }
    });
  }

  selectLocationOnMap(): void {
    if (this.simulationService.placingTransmitter()) {
      this.simulationService.cancelTransmitterPlacement();
      return;
    }
    this.recommendation.placing.set(false);
    this.recommendation.drawing.set(false);
    this.simulationService.startTransmitterPlacement();
  }

  updateDraftLocation(): void {
    const { latitude, longitude } = this.form.transmitters[0];
    if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
        && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
      this.simulationService.setDraftLocation({ latitude, longitude });
    }
  }

  async simulate(): Promise<void> {
    await this.simulationService.simulate(this.form);
  }
}
