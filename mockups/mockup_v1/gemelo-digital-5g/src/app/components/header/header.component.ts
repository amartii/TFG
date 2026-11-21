import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { SimulationService } from '../../services/simulation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header__brand">
        <span class="header__mark" aria-hidden="true">
          <svg viewBox="0 0 38 38" fill="none">
            <circle cx="19" cy="19" r="16" stroke="currentColor" stroke-width="1.5"/>
            <path d="M19 8v22M11 23l8-15 8 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="19" cy="19" r="3" fill="currentColor"/>
            <path d="M8 19h22" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/>
          </svg>
        </span>
        <div class="header__identity">
          <h1 class="header__title">Gemelo 5G</h1>
          <span class="header__subtitle">Planificación de cobertura</span>
        </div>
      </div>

      <nav class="header__nav">
        <div class="header__tag">
          <span class="header__tag-label">Frecuencia</span>
          <span class="header__tag-value font-mono">{{ freqLabel() }}</span>
        </div>
        <div class="header__tag">
          <span class="header__tag-label">Modelo</span>
          <span class="header__tag-value">{{ modelLabel() }}</span>
        </div>
        <div class="header__tag">
          <span class="header__tag-label">Terreno</span>
          <span class="header__tag-value">{{ terrainLabel() }}</span>
        </div>
        <div class="header__tag">
          <span class="header__tag-label">Ptx</span>
          <span class="header__tag-value font-mono">{{ powerLabel() }}</span>
        </div>
      </nav>

      <div class="header__actions">
        <button class="btn btn--icon" (click)="toggleTheme()" [title]="themeService.isDark() ? 'Modo claro' : 'Modo oscuro'">
          @if (themeService.isDark()) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          }
        </button>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  themeService = inject(ThemeService);
  private simService = inject(SimulationService);

  private meta = computed(() => this.simService.currentSimulation()?.metadata);

  freqLabel  = computed(() => {
    const f = this.meta()?.frequency_ghz;
    return f != null ? `${f} GHz` : '—';
  });
  modelLabel  = computed(() => this.meta()?.model   ?? '—');
  terrainLabel = computed(() => this.meta()?.terrain_data ?? '—');
  powerLabel  = computed(() => {
    const p = this.meta()?.tx_power_dbm;
    return p != null ? `${p} dBm` : '—';
  });

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
