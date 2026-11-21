import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MapComponent } from './components/map/map.component';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { ComparisonViewComponent } from './components/comparison-view/comparison-view.component';
import { SimulationService } from './services/simulation.service';
import { ComparisonService } from './services/comparison.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, MapComponent, InfoPanelComponent, ComparisonViewComponent],
  template: `
    <div class="app-container">
      @if (simulationService.loading() && simulationService.availableSimulations().length === 0) {
        <div class="boot-screen" role="status" aria-live="polite">
          <div class="boot-screen__mark" aria-hidden="true">
            <span>G</span><b>5</b>
          </div>
          <div class="boot-screen__copy">
            <strong>Preparando cobertura</strong>
            <span>Cargando simulaciones locales</span>
          </div>
          <div class="boot-screen__line"><i></i></div>
        </div>
      }
      <app-header />
      @if (simulationService.error()) {
        <div class="error-banner" role="alert">
          <span>{{ simulationService.error() }}</span>
          <button class="error-banner__retry" (click)="simulationService.loadSimulations()">Reintentar</button>
        </div>
      }
      <main class="main-content">
        <app-sidebar />
        @if (comparisonService.active() && comparisonService.simulationB()) {
          <app-comparison-view />
        } @else {
          <div class="map-area">
            <app-map />
            <app-info-panel />
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .boot-screen {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: grid;
      place-content: center;
      justify-items: start;
      gap: 18px;
      background: #090b0f;
      color: #eef2ff;
      font-family: 'Manrope', 'Segoe UI', sans-serif;
    }

    .boot-screen__mark {
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -0.08em;
    }

    .boot-screen__mark b {
      color: #d5deff;
      font-family: 'IBM Plex Mono', monospace;
    }

    .boot-screen__copy {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .boot-screen__copy strong {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .boot-screen__copy span {
      color: #8c96a8;
      font-size: 12px;
    }

    .boot-screen__line {
      width: 180px;
      height: 1px;
      overflow: hidden;
      background: #292f38;
    }

    .boot-screen__line i {
      display: block;
      width: 42%;
      height: 100%;
      background: #d5deff;
      animation: boot-line 1.1s ease-in-out infinite alternate;
    }

    @keyframes boot-line {
      from { transform: translateX(-100%); }
      to { transform: translateX(240%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .boot-screen__line i {
        transform: none;
        width: 100%;
        animation: none;
      }
    }

    .map-area {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .error-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 8px 16px;
      background: rgba(239, 68, 68, 0.1);
      border-bottom: 1px solid #ef4444;
      color: #ef4444;
      font-size: 0.8rem;
      font-family: var(--font-mono, monospace);
    }

    .error-banner__retry {
      padding: 3px 10px;
      border: 1px solid #ef4444;
      border-radius: 3px;
      background: transparent;
      color: #ef4444;
      cursor: pointer;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .error-banner__retry:hover {
      background: rgba(239, 68, 68, 0.15);
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Gemelo Digital 5G';
  public simulationService = inject(SimulationService);
  public comparisonService = inject(ComparisonService);

  ngOnInit(): void {
    this.simulationService.loadSimulations();
  }
}
