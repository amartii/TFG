import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';
import { ComparisonService, DifferencePoint } from '../../services/comparison.service';
import { MapTileService } from '../../services/map-tile.service';
import * as L from 'leaflet';
import 'leaflet.heat';

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

      <!-- Stack inferior derecho: leyenda de diferencia + selector de tema -->
      <div class="map-overlay map-overlay--bottom-right">
        <div class="bottom-right-stack">
          @if (comparisonService.active() && comparisonService.mode() === 'difference' && comparisonService.simulationB()) {
            <div class="diff-legend">
              <span class="diff-legend__title">ΔdB (A − B)</span>
              <div class="diff-legend__bar"></div>
              <div class="diff-legend__labels">
                <span>B mejor</span>
                <span>≈ Igual</span>
                <span>A mejor</span>
              </div>
            </div>
          }

          <div class="theme-selector" [title]="mapTileService.current().description">
            <span class="theme-selector__label">Tema</span>
            <div class="theme-selector__options">
              @for (theme of mapTileService.themes; track theme.id) {
                <button
                  class="theme-btn"
                  [class.theme-btn--active]="theme.id === mapTileService.current().id"
                  [title]="theme.name + ' — ' + theme.description"
                  (click)="mapTileService.setTheme(theme.id)">
                  @switch (theme.id) {
                    @case ('osm') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                        <line x1="8" y1="2" x2="8" y2="18"/>
                        <line x1="16" y1="6" x2="16" y2="22"/>
                      </svg>
                    }
                    @case ('satellite') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    }
                    @case ('terrain') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 20l5-9 4 7 3-5 6 7H3z"/>
                        <circle cx="17" cy="6" r="2"/>
                      </svg>
                    }
                  }
                </button>
              }
            </div>
          </div>
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
  comparisonService = inject(ComparisonService);
  mapTileService = inject(MapTileService);
  private map!: L.Map;
  private tileLayer?: L.Layer;
  private heatmapLayer: any;
  private heatmapLayerB: any;
  private diffLayerGroup?: L.LayerGroup;
  private txMarker?: L.Marker;
  private txMarkerB?: L.Marker;
  private heatmapVisible = true;
  private lastSimId: string | null = null;
  private resizeObserver?: ResizeObserver;

  currentLat?: number;
  currentLon?: number;

  constructor() {
    // Effect principal: heatmap A + centrado en TX cuando cambia la simulación
    effect(() => {
      const points = this.simulationService.filteredCoveragePoints();
      const simulation = this.simulationService.currentSimulation();

      if (this.map && simulation) {
        this.updateHeatmap(points);
        this.updateTxMarker(simulation.metadata.tx_location);
        this.currentLat = simulation.metadata.tx_location.latitude;
        this.currentLon = Math.abs(simulation.metadata.tx_location.longitude);

        // Centrar el mapa en la antena TX solo cuando cambia la simulación
        // (no en cada cambio de threshold, que también dispara el effect)
        if (simulation.simulation_id !== this.lastSimId) {
          this.lastSimId = simulation.simulation_id;
          this.map.setView(
            [simulation.metadata.tx_location.latitude, simulation.metadata.tx_location.longitude],
            14
          );
        }
      }
    });

    // Effect: cambio de tema del mapa → reemplaza el tile layer
    effect(() => {
      const theme = this.mapTileService.current();
      if (this.map) {
        if (this.tileLayer) {
          this.map.removeLayer(this.tileLayer);
        }
        this.tileLayer = this.mapTileService.createTileLayer(theme.id);
        this.tileLayer.addTo(this.map);
      }
    });

    // Effect de comparación: reacciona a mode, toggleView, opacity, y datos B
    effect(() => {
      const active = this.comparisonService.active();
      const mode = this.comparisonService.mode();
      const simB = this.comparisonService.simulationB();
      const pointsB = this.comparisonService.filteredCoveragePointsB();
      const diffPoints = this.comparisonService.differencePoints();
      const toggleView = this.comparisonService.toggleView();
      const opacity = this.comparisonService.overlayOpacity();
      const pointsA = this.simulationService.filteredCoveragePoints();
      const simA = this.simulationService.currentSimulation();

      if (!this.map) return;

      // Limpiar todas las capas de comparación
      this.clearComparisonLayers();

      if (!active || !simB) {
        // Sin comparación: mostrar A normal
        if (simA) {
          this.updateHeatmap(pointsA);
        }
        return;
      }

      switch (mode) {
        case 'toggle':
          if (toggleView === 'A') {
            this.updateHeatmap(pointsA);
            if (simA) this.updateTxMarker(simA.metadata.tx_location);
          } else {
            this.updateHeatmap(pointsB);
            this.updateTxMarker(simB.metadata.tx_location);
          }
          break;

        case 'difference':
          // Ocultar heatmaps normales, mostrar mapa de diferencias
          this.removeHeatmapA();
          this.renderDifferenceMap(diffPoints);
          if (simA) this.updateTxMarker(simA.metadata.tx_location);
          this.updateTxMarkerB(simB.metadata.tx_location);
          break;

        case 'overlay':
          // Ambos heatmaps con opacidad controlada
          this.updateHeatmap(pointsA, opacity);
          this.updateHeatmapB(pointsB, opacity);
          if (simA) this.updateTxMarker(simA.metadata.tx_location);
          this.updateTxMarkerB(simB.metadata.tx_location);
          break;
      }
    });
  }

  ngOnInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [40.2897, -3.8244],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    this.tileLayer = this.mapTileService.createTileLayer();
    this.tileLayer.addTo(this.map);

    // Click en el mapa → seleccionar punto más cercano
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const points = this.simulationService.filteredCoveragePoints();
      if (points.length === 0) return;

      let nearest = points[0];
      let minDist = Infinity;
      for (const p of points) {
        const d = Math.hypot(p.latitude - e.latlng.lat, p.longitude - e.latlng.lng);
        if (d < minDist) { minDist = d; nearest = p; }
      }
      if (minDist < 0.003) {
        this.simulationService.selectPoint(nearest);
      } else {
        this.simulationService.selectPoint(null);
      }
    });

    const simulation = this.simulationService.currentSimulation();
    if (simulation) {
      this.updateHeatmap(this.simulationService.filteredCoveragePoints());
      this.updateTxMarker(simulation.metadata.tx_location);
      this.currentLat = simulation.metadata.tx_location.latitude;
      this.currentLon = Math.abs(simulation.metadata.tx_location.longitude);
      this.map.setView(
        [simulation.metadata.tx_location.latitude, simulation.metadata.tx_location.longitude],
        14
      );
      this.lastSimId = simulation.simulation_id;
    }

    // Forzar a Leaflet a recalcular dimensiones cuando el contenedor llegue a su tamaño final.
    // Necesario al volver desde la vista de comparación: Leaflet "cachea" el tamaño al
    // crear el mapa y los tiles solo se cargan en el área inicial → línea invisible que
    // corta el heatmap si el contenedor crece después.
    requestAnimationFrame(() => this.map?.invalidateSize());

    const container = document.getElementById('map');
    if (container && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
      this.resizeObserver.observe(container);
    }
  }

  // ── Heatmap A ──────────────────────────────────────────────────────────────

  private updateHeatmap(points: { latitude: number; longitude: number; rsrp_dbm: number }[], opacity = 1.0): void {
    this.removeHeatmapA();
    if (!this.heatmapVisible || points.length === 0) return;

    const heatData: [number, number, number][] = points.map(p => [
      p.latitude,
      p.longitude,
      this.simulationService.normalizeRsrp(p.rsrp_dbm)
    ]);

    this.heatmapLayer = (L as any).heatLayer(heatData, {
      radius: 18,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0:  '#ef4444',
        0.4:  '#f97316',
        0.55: '#fbbf24',
        0.7:  '#10b981'
      }
    });

    this.heatmapLayer.addTo(this.map);
    if (opacity < 1.0) {
      this.heatmapLayer.getContainer()?.style.setProperty('opacity', String(opacity));
    }
  }

  private removeHeatmapA(): void {
    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
      this.heatmapLayer = null;
    }
  }

  // ── Heatmap B (overlay) ────────────────────────────────────────────────────

  private updateHeatmapB(points: { latitude: number; longitude: number; rsrp_dbm: number }[], opacity = 1.0): void {
    if (this.heatmapLayerB) {
      this.map.removeLayer(this.heatmapLayerB);
      this.heatmapLayerB = null;
    }
    if (points.length === 0) return;

    const heatData: [number, number, number][] = points.map(p => [
      p.latitude,
      p.longitude,
      this.simulationService.normalizeRsrp(p.rsrp_dbm)
    ]);

    this.heatmapLayerB = (L as any).heatLayer(heatData, {
      radius: 18,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0:  '#7c3aed',
        0.4:  '#3b82f6',
        0.55: '#06b6d4',
        0.7:  '#22d3ee'
      }
    });

    this.heatmapLayerB.addTo(this.map);
    if (opacity < 1.0) {
      this.heatmapLayerB.getContainer()?.style.setProperty('opacity', String(opacity));
    }
  }

  // ── Mapa de diferencias (ΔdB) ──────────────────────────────────────────────

  private renderDifferenceMap(diffPoints: DifferencePoint[]): void {
    if (this.diffLayerGroup) {
      this.map.removeLayer(this.diffLayerGroup);
    }

    if (diffPoints.length === 0) return;

    const markers = diffPoints.map(p => {
      const color = this.deltaToColor(p.delta);
      const radius = Math.max(4, Math.min(10, 4 + p.absDelta / 5));

      return L.circleMarker([p.latitude, p.longitude], {
        radius,
        fillColor: color,
        fillOpacity: 0.75,
        color: color,
        weight: 0.5,
        opacity: 0.9
      }).bindPopup(`
        <div style="font-family: monospace; font-size: 12px; padding: 4px;">
          <strong>Δ = ${p.delta > 0 ? '+' : ''}${p.delta.toFixed(1)} dB</strong><br>
          A: ${p.rsrp_a.toFixed(1)} dBm<br>
          B: ${p.rsrp_b.toFixed(1)} dBm<br>
          <span style="color: ${p.delta > 2 ? '#f97316' : p.delta < -2 ? '#3b82f6' : '#9ca3af'}">
            ${p.delta > 2 ? '▲ A más fuerte' : p.delta < -2 ? '▼ B más fuerte' : '≈ Similar'}
          </span>
        </div>
      `);
    });

    this.diffLayerGroup = L.layerGroup(markers);
    this.diffLayerGroup.addTo(this.map);
  }

  /** Convierte ΔdB a color divergente: naranja (A mejor) → gris (igual) → azul (B mejor) */
  private deltaToColor(delta: number): string {
    const maxDelta = 30; // ±30 dB clamp
    const t = Math.max(-1, Math.min(1, delta / maxDelta)); // [-1, 1]

    if (Math.abs(t) < 0.07) return '#6b7280'; // gris — similar

    if (t > 0) {
      // A mejor → naranja/rojo
      const r = 249;
      const g = Math.round(115 + (1 - t) * 100);
      const b = Math.round(22 + (1 - t) * 100);
      return `rgb(${r},${g},${b})`;
    } else {
      // B mejor → azul
      const abs = Math.abs(t);
      const r = Math.round(59 + (1 - abs) * 100);
      const g = Math.round(130 + (1 - abs) * 60);
      const b = 246;
      return `rgb(${r},${g},${b})`;
    }
  }

  // ── TX Markers ─────────────────────────────────────────────────────────────

  private updateTxMarker(location: { latitude: number; longitude: number }): void {
    if (this.txMarker) {
      this.map.removeLayer(this.txMarker);
    }

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
          <strong style="color: #00d4aa;">Transmisor A</strong><br>
          <span style="font-family: monospace; font-size: 12px;">
            ${location.latitude.toFixed(4)}°N, ${Math.abs(location.longitude).toFixed(4)}°W
          </span>
        </div>
      `);
  }

  private updateTxMarkerB(location: { latitude: number; longitude: number }): void {
    if (this.txMarkerB) {
      this.map.removeLayer(this.txMarkerB);
    }

    const txIconB = L.divIcon({
      className: 'tx-marker tx-marker--b',
      html: `
        <div class="tx-marker__inner" style="color: #3b82f6;">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L12 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            <path d="M5 8L12 2L19 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="2" r="3" fill="currentColor"/>
          </svg>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48]
    });

    this.txMarkerB = L.marker([location.latitude, location.longitude], { icon: txIconB })
      .addTo(this.map)
      .bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: #3b82f6;">Transmisor B</strong><br>
          <span style="font-family: monospace; font-size: 12px;">
            ${location.latitude.toFixed(4)}°N, ${Math.abs(location.longitude).toFixed(4)}°W
          </span>
        </div>
      `);
  }

  // ── Controles públicos ─────────────────────────────────────────────────────

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
    } else {
      this.removeHeatmapA();
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

  private clearComparisonLayers(): void {
    if (this.heatmapLayerB) {
      this.map.removeLayer(this.heatmapLayerB);
      this.heatmapLayerB = null;
    }
    if (this.diffLayerGroup) {
      this.map.removeLayer(this.diffLayerGroup);
      this.diffLayerGroup = undefined;
    }
    if (this.txMarkerB) {
      this.map.removeLayer(this.txMarkerB);
      this.txMarkerB = undefined;
    }
  }
}
