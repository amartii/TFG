import { Component, inject, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    @if (stats()) {
      <section class="stats">
        <div class="section-header">
          <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <h3 class="section-title">Estadísticas</h3>
        </div>

        <div class="stats__grid">
          <div class="stat-card">
            <div class="stat-card__value font-mono">{{ stats()!.coverageArea | number:'1.1-1' }}</div>
            <div class="stat-card__label">km² Área</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value font-mono">{{ stats()!.totalPoints | number }}</div>
            <div class="stat-card__label">Puntos</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value font-mono">{{ stats()!.avgRsrp | number:'1.1-1' }}</div>
            <div class="stat-card__label">dBm Medio</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value font-mono">{{ stats()!.coverageRadius | number:'1.2-2' }}</div>
            <div class="stat-card__label">km Radio</div>
          </div>
        </div>

        <!-- Distribución de calidad de señal -->
        <div class="distribution">
          <div class="distribution__header">
            <span>Distribución de Cobertura</span>
          </div>
          <div class="distribution__bars">
            <div class="dist-bar dist-bar--excellent" [style.width.%]="getPercentage('excellent')">
              <span class="dist-bar__label">{{ getPercentage('excellent') | number:'1.0-0' }}%</span>
            </div>
            <div class="dist-bar dist-bar--good" [style.width.%]="getPercentage('good')">
              <span class="dist-bar__label">{{ getPercentage('good') | number:'1.0-0' }}%</span>
            </div>
            <div class="dist-bar dist-bar--acceptable" [style.width.%]="getPercentage('acceptable')">
              <span class="dist-bar__label">{{ getPercentage('acceptable') | number:'1.0-0' }}%</span>
            </div>
            <div class="dist-bar dist-bar--weak" [style.width.%]="getPercentage('weak')">
              <span class="dist-bar__label">{{ getPercentage('weak') | number:'1.0-0' }}%</span>
            </div>
          </div>
          <div class="distribution__legend">
            <span class="legend-item"><span class="dot dot--excellent"></span> Excelente</span>
            <span class="legend-item"><span class="dot dot--good"></span> Buena</span>
            <span class="legend-item"><span class="dot dot--acceptable"></span> Aceptable</span>
            <span class="legend-item"><span class="dot dot--weak"></span> Débil</span>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    @use '../../../styles/variables' as *;

    .stats {
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

    .stats__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing-sm;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-md;
      background: $color-bg-tertiary;
      border-radius: $border-radius-md;
      border: 1px solid $color-border;
      text-align: center;

      &__value {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $color-accent-primary;
        line-height: 1;
      }

      &__label {
        font-size: $font-size-xs;
        color: $color-text-muted;
        margin-top: $spacing-xs;
      }
    }

    .distribution {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
      padding: $spacing-md;
      background: $color-bg-tertiary;
      border-radius: $border-radius-md;

      &__header {
        font-size: $font-size-xs;
        color: $color-text-secondary;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      &__bars {
        display: flex;
        height: 24px;
        border-radius: $border-radius-sm;
        overflow: hidden;
        background: $color-bg-secondary;
      }

      &__legend {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;
        font-size: $font-size-xs;
        color: $color-text-muted;
      }
    }

    .dist-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      transition: width $transition-base;

      &__label {
        font-size: 10px;
        font-weight: $font-weight-semibold;
        color: $color-bg-primary;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }

      &--excellent { background: $color-rsrp-excellent; }
      &--good { background: $color-rsrp-good; }
      &--acceptable { background: $color-rsrp-acceptable; }
      &--weak { background: $color-rsrp-weak; }
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &--excellent { background: $color-rsrp-excellent; }
      &--good { background: $color-rsrp-good; }
      &--acceptable { background: $color-rsrp-acceptable; }
      &--weak { background: $color-rsrp-weak; }
    }
  `]
})
export class StatsPanelComponent {
  private simulationService = inject(SimulationService);

  stats = computed(() => this.simulationService.simulationStats());

  getPercentage(type: 'excellent' | 'good' | 'acceptable' | 'weak'): number {
    const s = this.stats();
    if (!s || s.totalPoints === 0) return 0;

    switch (type) {
      case 'excellent': return (s.pointsExcellent / s.totalPoints) * 100;
      case 'good': return (s.pointsGood / s.totalPoints) * 100;
      case 'acceptable': return (s.pointsAcceptable / s.totalPoints) * 100;
      case 'weak': return (s.pointsWeak / s.totalPoints) * 100;
    }
  }
}
