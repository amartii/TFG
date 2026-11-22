import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SimulationService } from '../../services/simulation.service';
import { ComparisonService } from '../../services/comparison.service';
import { AvailableSimulationSummary } from '../../models/simulation.model';
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
        <app-simulation-config />

        <!-- Selector de Simulación -->
        <section class="sidebar__section">
          <div class="section-header">
            <span class="section-dot"></span>
            <h3 class="section-title">Escenario activo</h3>
          </div>

          @if (simulationService.loading()) {
            <div class="loading-indicator">
              <span class="spinner"></span>
              <span>Cargando escenario...</span>
            </div>
          }

          <select
            class="form-control"
            [disabled]="simulationService.validAvailableSimulations().length === 0 || simulationService.loading() || simulationService.simulationRunning()"
            [value]="simulationService.currentSimulation()?.simulation_id"
            (change)="onSimulationChange($event)">
            @for (sim of simulationService.validAvailableSimulations(); track sim.simulation_id) {
              <option [value]="sim.simulation_id">
                {{ scenarioLabel(sim) }}
              </option>
            }
          </select>
          @if (!simulationService.loading() && !simulationService.error() && simulationService.availableSimulations().length === 0) {
            <p class="empty-state" role="status">No hay simulaciones guardadas. Configura los parámetros y pulsa Simular.</p>
          } @else if (!simulationService.loading() && simulationService.validAvailableSimulations().length === 0) {
            <p class="empty-state" role="status">No hay simulaciones válidas para seleccionar. Revisa los diagnósticos del histórico.</p>
          }
        </section>

        @if (simulationService.availableSimulations().length > 0) {
          <section class="sidebar__section">
            <details class="history-management">
              <summary>Histórico de simulaciones ({{ simulationService.availableSimulations().length }})</summary>
              <p class="history-management__note">
                Eliminar una entrada también borra permanentemente su archivo JSON del directorio de datos.
              </p>
              @if (historyError()) {
                <p class="history-error" role="alert">{{ historyError() }}</p>
              }
              <div class="history-list">
                @for (sim of simulationService.availableSimulations(); track sim.simulation_id) {
                  @if (sim.valid) {
                    <div class="history-item">
                      <span class="history-item__name" [title]="sim.simulation_id">
                        {{ scenarioLabel(sim) }}
                      </span>
                      @if (sim.simulation_id === simulationService.currentSimulation()?.simulation_id) {
                        <span class="history-item__badge history-item__badge--a">A</span>
                      }
                      @if (sim.simulation_id === comparisonService.simulationBId()) {
                        <span class="history-item__badge history-item__badge--b">B</span>
                      }
                      <button
                        type="button"
                        class="history-item__delete"
                        [disabled]="simulationService.deletingSimulationId() !== null
                          || simulationService.simulationRunning()
                          || simulationService.loading()
                          || comparisonService.loadingB()"
                        [attr.aria-label]="'Eliminar ' + scenarioLabel(sim) + ' del histórico'"
                        (click)="deleteFromHistory(sim.simulation_id, scenarioLabel(sim))">
                        {{ simulationService.deletingSimulationId() === sim.simulation_id ? 'Eliminando…' : 'Eliminar' }}
                      </button>
                    </div>
                  } @else {
                    <div class="history-item history-item--invalid">
                      <div class="history-item__invalid-copy">
                        <span class="history-item__name">Resumen no válido · {{ sim.simulation_id }}</span>
                        <span class="history-item__error" role="alert">{{ sim.error }}</span>
                      </div>
                      <button type="button" class="history-item__delete" disabled
                        [attr.aria-label]="'No disponible: ' + sim.simulation_id"
                        title="No se puede seleccionar, comparar ni borrar un archivo con identidad o contenido inválido">
                        No disponible
                      </button>
                    </div>
                  }
                }
              </div>
            </details>
          </section>
        }

        <!-- Comparación de simulaciones -->
        <section class="sidebar__section">
          <div class="section-header">
            <span class="section-dot"></span>
            <h3 class="section-title">Comparación de escenarios</h3>
          </div>

          @if (!comparisonService.active()) {
            <button
              class="btn btn--compare"
              [disabled]="!simulationService.currentSimulation() || comparisonService.comparableSimulations().length === 0
                || simulationService.simulationRunning() || simulationService.loading()"
              (click)="comparisonService.startComparison()">
              Comparar escenarios
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
                  <option value="">Seleccionar...</option>
                  @for (sim of comparisonService.comparableSimulations(); track sim.simulation_id) {
                    <option [value]="sim.simulation_id">
                      {{ scenarioLabel(sim) }}
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

              @if (comparisonService.errorB(); as error) {
                <p class="history-error" role="alert">{{ error }}</p>
                <button type="button" class="btn btn--exit-compare" (click)="retryComparisonB()">
                  Reintentar carga de B
                </button>
              }

              @if (comparisonService.simulationB()) {
                <div class="comparison-hint">
                  Dos vistas independientes con lectura agregada
                </div>
              }

              <button class="btn btn--exit-compare" (click)="comparisonService.stopComparison()">
                Salir de comparación
              </button>
            </div>
          }
        </section>

        <!-- Filtro RSRP -->
        <section class="sidebar__section">
          <div class="section-header">
            <span class="section-dot"></span>
            <h3 class="section-title">Umbral de señal</h3>
          </div>

          <div class="filter-control">
            <div class="filter-labels">
              <span>Mostrar desde RSRP</span>
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
              / {{ (simulationService.currentSimulation()?.coverage_points?.length ?? 0) | number }}
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
          <span>Datos locales · JavaScript y API REST</span>
        </div>
        <div class="footer-credits">
          <span>TFG · Álvaro Martínez Téllez</span>
          <span class="text-muted">URJC · 2025/2026</span>
        </div>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  simulationService = inject(SimulationService);
  comparisonService = inject(ComparisonService);
  readonly historyError = signal<string | null>(null);

  async onSimulationChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    this.comparisonService.reconcilePrimarySelection(select.value || null);
    await this.simulationService.selectSimulation(select.value);
    this.comparisonService.reconcilePrimarySelection(
      this.simulationService.currentSimulation()?.simulation_id ?? null
    );
  }

  scenarioLabel(simulation: AvailableSimulationSummary): string {
    return simulation.metadata?.scenario_name || simulation.name || simulation.simulation_id;
  }

  async onComparisonBChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      await this.comparisonService.selectSimulationB(select.value);
    } else {
      this.comparisonService.clearSimulationB();
    }
  }

  async retryComparisonB(): Promise<void> {
    const id = this.comparisonService.simulationBId();
    if (id) await this.comparisonService.selectSimulationB(id);
  }

  async deleteFromHistory(id: string, name: string): Promise<void> {
    const confirmed = window.confirm(
      `¿Eliminar "${name}" del histórico?\n\nSe borrará permanentemente el archivo ${id}.json del directorio de datos.`
    );
    if (!confirmed) return;

    this.historyError.set(null);
    try {
      const primaryId = await this.simulationService.deleteSimulation(id);
      this.comparisonService.reconcileDeletedSimulation(id, primaryId);
    } catch (error) {
      this.historyError.set(this.deletionErrorMessage(error));
      console.error('[SidebarComponent] Error eliminando simulación:', error);
    }
  }

  onThresholdChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.simulationService.setRsrpThreshold(parseInt(input.value, 10));
  }

  private deletionErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;
      if (typeof payload === 'object' && payload !== null && 'detail' in payload
        && typeof payload['detail'] === 'string') {
        return `No se pudo eliminar: ${payload['detail']}`;
      }
      if (error.status === 404) return 'La simulación ya no existe en el backend; vuelve a cargar el histórico.';
      return `No se pudo eliminar la simulación (HTTP ${error.status}).`;
    }
    return error instanceof Error
      ? `No se pudo eliminar la simulación: ${error.message}`
      : 'No se pudo eliminar la simulación por un error inesperado.';
  }
}
