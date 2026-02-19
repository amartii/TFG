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
          <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <h3 class="section-title">Parámetros TX</h3>
        </div>

        <div class="config__params">
          <div class="param">
            <div class="param__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
            </div>
            <div class="param__content">
              <span class="param__label">Frecuencia</span>
              <span class="param__value font-mono">{{ simulation()!.metadata.frequency_ghz }} GHz</span>
              <span class="param__badge">Banda n78</span>
            </div>
          </div>

          <div class="param">
            <div class="param__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div class="param__content">
              <span class="param__label">Potencia EIRP</span>
              <span class="param__value font-mono">{{ simulation()!.metadata.tx_power_dbm }} dBm</span>
              <span class="param__badge">{{ getPowerWatts() }}W</span>
            </div>
          </div>

          <div class="param">
            <div class="param__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20"/>
                <path d="M2 12h20"/>
                <path d="M12 2l4 4-4 4"/>
              </svg>
            </div>
            <div class="param__content">
              <span class="param__label">Altura Antena</span>
              <span class="param__value font-mono">{{ simulation()!.metadata.antenna_height_m }} m</span>
              <span class="param__badge">Mástil</span>
            </div>
          </div>

          <div class="param">
            <div class="param__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <div class="param__content">
              <span class="param__label">Área Simulada</span>
              <span class="param__value font-mono">
                {{ simulation()!.coverage_area.width_km }}×{{ simulation()!.coverage_area.height_km }} km
              </span>
              <span class="param__badge">Grid {{ simulation()!.coverage_area.grid_spacing_m }}m</span>
            </div>
          </div>

          <div class="param">
            <div class="param__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div class="param__content">
              <span class="param__label">Modelo</span>
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

    .section-icon {
      width: 18px;
      height: 18px;
      color: $color-accent-primary;
    }

    .section-title {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $color-text-primary;
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
      align-items: flex-start;
      gap: $spacing-md;
      padding: $spacing-sm $spacing-md;
      background: $color-bg-tertiary;
      border-radius: $border-radius-md;
      border: 1px solid transparent;
      transition: all $transition-fast;

      &:hover {
        border-color: $color-border;
        background: $color-bg-hover;
      }

      &__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba($color-accent-primary, 0.1);
        border-radius: $border-radius-sm;
        flex-shrink: 0;

        svg {
          width: 16px;
          height: 16px;
          color: $color-accent-primary;
        }
      }

      &__content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1;
      }

      &__label {
        font-size: $font-size-xs;
        color: $color-text-muted;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      &__value {
        font-size: $font-size-sm;
        color: $color-text-primary;
        font-weight: $font-weight-medium;
      }

      &__badge {
        display: inline-block;
        width: fit-content;
        padding: 2px 6px;
        background: rgba($color-accent-secondary, 0.15);
        border-radius: $border-radius-sm;
        font-size: 10px;
        color: $color-accent-secondary;
        margin-top: 2px;
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
