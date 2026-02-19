import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header__brand">
        <div class="header__logo">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" opacity="0.3"/>
            <circle cx="20" cy="20" r="12" stroke="currentColor" stroke-width="2" opacity="0.5"/>
            <circle cx="20" cy="20" r="6" fill="currentColor"/>
            <path d="M20 2 L20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M20 32 L20 38" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M2 20 L8 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M32 20 L38 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="header__title-group">
          <h1 class="header__title">Gemelo Digital 5G</h1>
          <span class="header__subtitle">Planificación de Cobertura - Burbujas Tácticas</span>
        </div>
      </div>

      <nav class="header__nav">
        <div class="header__status">
          <span class="status-indicator status-indicator--online"></span>
          <span>Sistema Activo</span>
        </div>

        <div class="header__info">
          <div class="header__info-item">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Banda FR1 - 3.5 GHz</span>
          </div>
          <div class="header__info-item">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span>Modelo Longley-Rice</span>
          </div>
        </div>
      </nav>

      <div class="header__actions">
        <button class="btn btn--icon" title="Configuración">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
        <button class="btn btn--icon" title="Ayuda">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
        </button>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {}
