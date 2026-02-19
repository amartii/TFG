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
        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
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

      <div class="legend__note">
        <svg class="legend__note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>RSRP: Reference Signal Received Power - Indicador principal de cobertura 5G NR</span>
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
      background: $color-bg-tertiary;
      border-radius: $border-radius-md;
      transition: background $transition-fast;

      &:hover {
        background: $color-bg-hover;
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
      color: $color-text-primary;
    }

    .legend__range {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }

    .legend__note {
      display: flex;
      gap: $spacing-sm;
      padding: $spacing-sm $spacing-md;
      background: rgba($color-accent-secondary, 0.1);
      border: 1px solid rgba($color-accent-secondary, 0.2);
      border-radius: $border-radius-md;
      font-size: $font-size-xs;
      color: $color-text-secondary;
      line-height: 1.4;
    }

    .legend__note-icon {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      color: $color-accent-secondary;
    }
  `]
})
export class CoverageLegendComponent {
  levels = RSRP_LEVELS;
}
