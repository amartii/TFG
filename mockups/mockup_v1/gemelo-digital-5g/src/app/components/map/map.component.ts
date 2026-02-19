import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';
import * as L from 'leaflet';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div id="map" class="map"></div>

      <!-- Overlay de información del mapa -->
      <div class="map-overlay map-overlay--top-right">
        <div class="map-info">
          <span class="map-info__label">Coordenadas TX</span>
          <span class="map-info__value font-mono">
            {{ currentLat?.toFixed(4) }}°N, {{ currentLon?.toFixed(4) }}°W
          </span>
        </div>
      </div>

      <!-- Controles adicionales -->
      <div class="map-overlay map-overlay--bottom-left">
        <div class="map-controls">
          <button class="map-control-btn" (click)="centerOnTx()" title="Centrar en transmisor">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
          </button>
          <button class="map-control-btn" (click)="toggleHeatmap()" title="Toggle Heatmap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
              <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          <button class="map-control-btn" (click)="fitBounds()" title="Ajustar vista">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, OnDestroy {
  private simulationService = inject(SimulationService);
  private map!: L.Map;
  private heatmapLayer: any;
  private txMarker?: L.Marker;
  private heatmapVisible = true;

  currentLat?: number;
  currentLon?: number;

  constructor() {
    // Effect para actualizar el heatmap cuando cambian los datos
    effect(() => {
      const points = this.simulationService.filteredCoveragePoints();
      const simulation = this.simulationService.currentSimulation();

      if (this.map && simulation) {
        this.updateHeatmap(points);
        this.updateTxMarker(simulation.metadata.tx_location);
        this.currentLat = simulation.metadata.tx_location.latitude;
        this.currentLon = Math.abs(simulation.metadata.tx_location.longitude);
      }
    });
  }

  ngOnInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Inicializar mapa centrado en Campus URJC por defecto
    this.map = L.map('map', {
      center: [40.2897, -3.8244],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // Añadir capa base con estilo oscuro
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    // Cargar datos iniciales
    const simulation = this.simulationService.currentSimulation();
    if (simulation) {
      this.updateHeatmap(this.simulationService.filteredCoveragePoints());
      this.updateTxMarker(simulation.metadata.tx_location);
      this.currentLat = simulation.metadata.tx_location.latitude;
      this.currentLon = Math.abs(simulation.metadata.tx_location.longitude);
    }
  }

  private updateHeatmap(points: { latitude: number; longitude: number; rsrp_dbm: number }[]): void {
    // Remover capa anterior
    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
    }

    if (!this.heatmapVisible || points.length === 0) return;

    // Preparar datos para heatmap
    const heatData: [number, number, number][] = points.map(p => [
      p.latitude,
      p.longitude,
      this.simulationService.normalizeRsrp(p.rsrp_dbm)
    ]);

    // Crear capa de heatmap usando Canvas
    this.heatmapLayer = this.createCanvasHeatmap(heatData);
    this.heatmapLayer.addTo(this.map);
  }

  private createCanvasHeatmap(data: [number, number, number][]): L.Layer {
    // Crear una capa de círculos como heatmap simplificado
    const layerGroup = L.layerGroup();

    data.forEach(([lat, lon, intensity]) => {
      const color = this.getHeatColor(intensity);
      const circle = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: color,
        fillOpacity: 0.6,
        color: color,
        weight: 0,
        opacity: 0.8
      });

      circle.on('click', () => {
        const rsrp = (intensity * 100) - 140;
        const point = { latitude: lat, longitude: lon, rsrp_dbm: rsrp };
        this.simulationService.selectPoint(point);
      });

      layerGroup.addLayer(circle);
    });

    return layerGroup;
  }

  private getHeatColor(intensity: number): string {
    // Gradiente: rojo -> naranja -> amarillo -> verde
    if (intensity >= 0.7) return '#10b981'; // Excelente
    if (intensity >= 0.55) return '#fbbf24'; // Bueno
    if (intensity >= 0.4) return '#f97316'; // Aceptable
    return '#ef4444'; // Débil
  }

  private updateTxMarker(location: { latitude: number; longitude: number }): void {
    if (this.txMarker) {
      this.map.removeLayer(this.txMarker);
    }

    // Crear icono personalizado para el transmisor
    const txIcon = L.divIcon({
      className: 'tx-marker',
      html: `
        <div class="tx-marker__inner">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L12 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            <path d="M5 8L12 2L19 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="2" r="3" fill="currentColor"/>
            <path d="M8 12C8 12 6 10 6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            <path d="M16 12C16 12 18 10 18 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            <path d="M5 15C5 15 2 12 2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <path d="M19 15C19 15 22 12 22 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
          </svg>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48]
    });

    this.txMarker = L.marker([location.latitude, location.longitude], { icon: txIcon })
      .addTo(this.map)
      .bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: #00d4aa;">Transmisor 5G</strong><br>
          <span style="font-family: monospace; font-size: 12px;">
            ${location.latitude.toFixed(4)}°N, ${Math.abs(location.longitude).toFixed(4)}°W
          </span>
        </div>
      `);
  }

  centerOnTx(): void {
    const simulation = this.simulationService.currentSimulation();
    if (simulation) {
      this.map.setView(
        [simulation.metadata.tx_location.latitude, simulation.metadata.tx_location.longitude],
        14
      );
    }
  }

  toggleHeatmap(): void {
    this.heatmapVisible = !this.heatmapVisible;
    if (this.heatmapVisible) {
      this.updateHeatmap(this.simulationService.filteredCoveragePoints());
    } else if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
    }
  }

  fitBounds(): void {
    const simulation = this.simulationService.currentSimulation();
    if (simulation && simulation.coverage_points.length > 0) {
      const bounds = L.latLngBounds(
        simulation.coverage_points.map(p => [p.latitude, p.longitude] as [number, number])
      );
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }
}
