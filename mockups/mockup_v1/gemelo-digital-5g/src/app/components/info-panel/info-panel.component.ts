import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';

@Component({
  selector: 'app-info-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (selectedPoint()) {
      <div class="info-panel">
        <div class="info-panel__header">
          <h4 class="info-panel__title">
            <svg class="info-panel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Punto de Cobertura
          </h4>
          <button class="info-panel__close" (click)="closePanel()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="info-panel__content">
          <!-- Nivel de señal -->
          <div class="signal-indicator" [class]="'signal-indicator--' + rsrpLevel().label.toLowerCase()">
            <div class="signal-indicator__value font-mono">
              {{ selectedPoint()!.rsrp_dbm.toFixed(1) }} dBm
            </div>
            <div class="signal-indicator__label">{{ rsrpLevel().label }}</div>
            <div class="signal-indicator__bars">
              @for (bar of [1,2,3,4]; track bar) {
                <div class="bar" [class.active]="getBarActive(bar)"></div>
              }
            </div>
          </div>

          <!-- Coordenadas -->
          <div class="info-row">
            <span class="info-row__label">Latitud</span>
            <span class="info-row__value font-mono">{{ selectedPoint()!.latitude.toFixed(6) }}°</span>
          </div>
          <div class="info-row">
            <span class="info-row__label">Longitud</span>
            <span class="info-row__value font-mono">{{ selectedPoint()!.longitude.toFixed(6) }}°</span>
          </div>

          <!-- Métricas adicionales -->
          <div class="info-row">
            <span class="info-row__label">Umbral 3GPP</span>
            <span class="info-row__value font-mono">{{ rsrpLevel().min }} / {{ rsrpLevel().max }} dBm</span>
          </div>
          <div class="info-row no-border">
            <span class="info-row__label">Path loss est.</span>
            <span class="info-row__value font-mono">{{ pathLoss() }} dB</span>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './info-panel.component.scss'
})
export class InfoPanelComponent {
  private simulationService = inject(SimulationService);

  selectedPoint = computed(() => this.simulationService.currentSelectedPoint());

  rsrpLevel = computed(() => {
    const point = this.selectedPoint();
    if (!point) return { label: '—', description: '', color: '#888', min: -140, max: -40 };
    return this.simulationService.getRsrpLevel(point.rsrp_dbm);
  });

  // EIRP estimado de la simulación activa (Ptx + Gtx - cable ≈ parámetros del JSON)
  pathLoss = computed(() => {
    const point = this.selectedPoint();
    const meta  = this.simulationService.currentSimulation()?.metadata;
    if (!point || !meta) return '—';
    // EIRP ≈ Ptx + 15 dBi antena - 2 dB cable = Ptx + 13 (approx genérico)
    const eirp_approx = (meta.tx_power_dbm ?? 40) + 13;
    // Path loss = EIRP - RSRP (ignorando ganancia Rx ~0 dBi)
    const pl = eirp_approx - point.rsrp_dbm;
    return `${pl.toFixed(1)}`;
  });

  closePanel(): void {
    this.simulationService.selectPoint(null);
  }

  getBarActive(bar: number): boolean {
    const rsrp = this.selectedPoint()?.rsrp_dbm;
    if (rsrp == null) return false;
    if (bar === 1) return rsrp >= -140;
    if (bar === 2) return rsrp >= -100;
    if (bar === 3) return rsrp >= -85;
    if (bar === 4) return rsrp >= -70;
    return false;
  }
}
