import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RSRP_LEVELS } from '../../models/simulation.model';

@Component({
  selector: 'app-coverage-legend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="legend">
      <div class="section-header">
        <span class="section-dot"></span>
        <h3 class="section-title">Leyenda RSRP</h3>
      </div>

      <div class="legend__items">
        @for (level of levels; track level.label) {
          <div class="legend__item">
            <div class="legend__color" [style.background-color]="level.color"></div>
            <div class="legend__info">
              <span class="legend__label">{{ level.label }}</span>
              <span class="legend__range font-mono">
                {{ level.min }} a {{ level.max }} dBm
              </span>
            </div>
          </div>
        }
      </div>


    </section>
  `,
  styles: [`
    @use '../../../styles/variables' as *;

    .legend {
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

    .legend__items {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }

    .legend__item {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-sm $spacing-md;
      background: var(--bg-tertiary);
      border-radius: $border-radius-md;
      transition: background $transition-fast;

      &:hover {
        background: var(--bg-hover);
      }
    }

    .legend__color {
      width: 24px;
      height: 24px;
      border-radius: $border-radius-sm;
      box-shadow: 0 0 8px currentColor;
    }

    .legend__info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .legend__label {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: var(--text-primary);
    }

    .legend__range {
      font-size: $font-size-xs;
      color: var(--text-muted);
    }


  `]
})
export class CoverageLegendComponent {
  levels = RSRP_LEVELS;
}
