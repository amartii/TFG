import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../../services/simulation.service';
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
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <h3 class="section-title">Simulación Activa</h3>
          </div>

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

        <!-- Configuración de la Simulación -->
        <app-simulation-config />

        <!-- Filtro RSRP -->
        <section class="sidebar__section">
          <div class="section-header">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
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
          <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
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
  lastUpdate = new Date().toLocaleTimeString('es-ES');

  onSimulationChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.simulationService.selectSimulation(select.value);
  }

  onThresholdChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.simulationService.setRsrpThreshold(parseInt(input.value, 10));
  }
}
