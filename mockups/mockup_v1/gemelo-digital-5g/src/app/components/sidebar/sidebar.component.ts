import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../../services/simulation.service';
import { ComparisonService } from '../../services/comparison.service';
import { CoverageLegendComponent } from '../coverage-legend/coverage-legend.component';
import { StatsPanelComponent } from '../stats-panel/stats-panel.component';
import { SimulationConfigComponent } from '../simulation-config/simulation-config.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, CoverageLegendComponent, StatsPanelComponent, SimulationConfigComponent],
  template: `
    <aside class="sidebar">
      <div class="sidebar__content">
        <!-- Selector de Simulación -->
        <section class="sidebar__section">
          <div class="section-header">
            <span class="section-dot"></span>
            <h3 class="section-title">Simulación Activa</h3>
          </div>

          @if (simulationService.loading()) {
            <div class="loading-indicator">
              <span class="spinner"></span>
              <span>Cargando simulación...</span>
            </div>
          }

          <select
            class="form-control"
            [value]="simulationService.currentSimulation()?.simulation_id"
            (change)="onSimulationChange($event)">
            @for (sim of simulationService.availableSimulations(); track sim.simulation_id) {
              <option [value]="sim.simulation_id">
                {{ sim.metadata.scenario_name || sim.simulation_id }}
              </option>
            }
          </select>
        </section>

        <!-- Comparación de simulaciones -->
        <section class="sidebar__section">
          <div class="section-header">
            <span class="section-dot"></span>
            <h3 class="section-title">Comparación</h3>
          </div>

          @if (!comparisonService.active()) {
            <button
              class="btn btn--compare"
              [disabled]="comparisonService.comparableSimulations().length === 0"
              (click)="comparisonService.startComparison()">
              Comparar simulaciones
            </button>
          } @else {
            <div class="comparison-controls">
              <label class="comparison-label">
                <span class="comparison-badge comparison-badge--a">A</span>
                {{ simulationService.currentSimulation()?.metadata?.scenario_name || 'Principal' }}
              </label>

              <label class="comparison-label">
                <span class="comparison-badge comparison-badge--b">B</span>
                <select
                  class="form-control form-control--sm"
                  [value]="comparisonService.simulationBId() || ''"
                  (change)="onComparisonBChange($event)">
                  <option value="" disabled>Seleccionar...</option>
                  @for (sim of comparisonService.comparableSimulations(); track sim.simulation_id) {
                    <option [value]="sim.simulation_id">
                      {{ sim.metadata.scenario_name || sim.simulation_id }}
                    </option>
                  }
                </select>
              </label>

              @if (comparisonService.loadingB()) {
                <div class="loading-indicator">
                  <span class="spinner"></span>
                  <span>Cargando B...</span>
                </div>
              }

              @if (comparisonService.simulationB()) {
                <div class="comparison-hint">
                  Vista dividida activa — dashboard en panel central
                </div>
              }

              <button class="btn btn--exit-compare" (click)="comparisonService.stopComparison()">
                Salir de comparación
              </button>
            </div>
          }
        </section>

        <!-- Configuración de la Simulación -->
        <app-simulation-config />

        <!-- Filtro RSRP -->
        <section class="sidebar__section">
          <div class="section-header">
            <span class="section-dot"></span>
            <h3 class="section-title">Filtro de Cobertura</h3>
          </div>

          <div class="filter-control">
            <div class="filter-labels">
              <span>Umbral RSRP mínimo</span>
              <span class="filter-value font-mono">{{ simulationService.currentThreshold() }} dBm</span>
            </div>
            <input
              type="range"
              class="range-slider"
              min="-140"
              max="-40"
              step="5"
              [value]="simulationService.currentThreshold()"
              (input)="onThresholdChange($event)" />
            <div class="filter-range">
              <span>-140 dBm</span>
              <span>-40 dBm</span>
            </div>
          </div>

          <div class="filter-info">
            <span class="filter-info__label">Puntos visibles:</span>
            <span class="filter-info__value font-mono">
              {{ simulationService.filteredCoveragePoints().length | number }}
              / {{ simulationService.currentSimulation()?.coverage_points?.length | number }}
            </span>
          </div>
        </section>

        <!-- Leyenda de Cobertura -->
        <app-coverage-legend />

        <!-- Estadísticas -->
        <app-stats-panel />
      </div>

      <div class="sidebar__footer">
        <div class="footer-info">
          <span>Última actualización: {{ lastUpdate }}</span>
        </div>
        <div class="footer-credits">
          <span>TFG - Álvaro Martínez Téllez</span>
          <span class="text-muted">URJC 2025/2026</span>
        </div>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  simulationService = inject(SimulationService);
  comparisonService = inject(ComparisonService);
  lastUpdate = new Date().toLocaleTimeString('es-ES');

  async onSimulationChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    await this.simulationService.selectSimulation(select.value);
  }

  async onComparisonBChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      await this.comparisonService.selectSimulationB(select.value);
    }
  }

  onThresholdChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.simulationService.setRsrpThreshold(parseInt(input.value, 10));
  }
}
