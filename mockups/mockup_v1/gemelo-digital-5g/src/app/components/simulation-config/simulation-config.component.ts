import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';

@Component({
  selector: 'app-simulation-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (simulation()) {
      <section class="config">
        <div class="section-header">
          <span class="section-dot"></span>
          <h3 class="section-title">Parámetros TX</h3>
        </div>

        <div class="config__params">
          <div class="param">
            <span class="param__label">Frecuencia</span>
            <div class="param__values">
              <span class="param__value font-mono">{{ simulation()!.metadata.frequency_ghz }} GHz</span>
              <span class="param__badge">n78</span>
            </div>
          </div>

          <div class="param">
            <span class="param__label">Potencia EIRP</span>
            <div class="param__values">
              <span class="param__value font-mono">{{ simulation()!.metadata.tx_power_dbm }} dBm</span>
              <span class="param__badge">{{ getPowerWatts() }}W</span>
            </div>
          </div>

          <div class="param">
            <span class="param__label">Altura Antena</span>
            <div class="param__values">
              <span class="param__value font-mono">{{ simulation()!.metadata.antenna_height_m }} m</span>
              <span class="param__badge">Mástil</span>
            </div>
          </div>

          <div class="param">
            <span class="param__label">Área Simulada</span>
            <div class="param__values">
              <span class="param__value font-mono">
                {{ simulation()!.coverage_area.width_km }}×{{ simulation()!.coverage_area.height_km }} km
              </span>
              <span class="param__badge">Grid {{ simulation()!.coverage_area.grid_spacing_m }}m</span>
            </div>
          </div>

          <div class="param">
            <span class="param__label">Modelo</span>
            <div class="param__values">
              <span class="param__value">{{ simulation()!.metadata.model }}</span>
              <span class="param__badge">{{ simulation()!.metadata.terrain_data }}</span>
            </div>
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
  private simulationService = inject(SimulationService);

  simulation = computed(() => this.simulationService.currentSimulation());

  getPowerWatts(): string {
    const sim = this.simulation();
    if (!sim) return '0';
    const watts = Math.pow(10, sim.metadata.tx_power_dbm / 10) / 1000;
    return watts.toFixed(1);
  }
}
