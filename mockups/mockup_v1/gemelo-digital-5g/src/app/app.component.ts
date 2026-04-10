import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MapComponent } from './components/map/map.component';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { SimulationService } from './services/simulation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, MapComponent, InfoPanelComponent],
  template: `
    <div class="app-container">
      <app-header />
      <main class="main-content">
        <app-sidebar />
        <div class="map-area">
          <app-map />
          <app-info-panel />
        </div>
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

    .map-area {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Gemelo Digital 5G';
  private simulationService = inject(SimulationService);

  ngOnInit(): void {
    this.simulationService.loadSimulations();
  }
}
