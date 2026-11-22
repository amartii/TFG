import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';
import { ComparisonService, DifferencePoint } from '../../services/comparison.service';
import { MapTileService } from '../../services/map-tile.service';
import { RecommendationResult, RecommendationService } from '../../services/recommendation.service';
import { CoveragePoint, Location, TerrainExtent } from '../../models/simulation.model';
import L from 'leaflet';
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
      @if (simulationService.currentSimulation(); as simulation) {
        @if (simulation.coverage_points.length === 0 && !simulationService.loading()) {
          <div class="map-overlay map-overlay--top-left">
            <p class="map-empty" role="status">
              No hay puntos de cobertura para mostrar en esta simulación.
            </p>
          </div>
        }
      }

      <!-- Overlay de información del mapa -->
      <div class="map-overlay map-overlay--top-right">
        <div class="map-info">
          <span class="map-info__label">{{ simulationService.pendingLocation() ? 'Antena propuesta' : 'Antena del escenario' }}</span>
          <span class="map-info__value font-mono">
            {{ currentLat?.toFixed(4) ?? '—' }}°, {{ currentLon?.toFixed(4) ?? '—' }}°
          </span>
          @if (simulationService.placingTransmitter()) {
            <span class="map-info__label" role="status">Clic para colocar el gNodeB</span>
          }
        </div>
      </div>

      <!-- Stack inferior derecho: leyenda de diferencia + selector de tema -->
      <div class="map-overlay map-overlay--bottom-right">
        <div class="bottom-right-stack">
          @if (simulationService.terrainLoading()) {
            <div class="terrain-extent-card" role="status">Consultando extensión del raster de terreno…</div>
          }
          @if (simulationService.terrainError(); as terrainError) {
            <div class="terrain-extent-card terrain-extent-card--error" role="alert">
              <strong>Extensión del terreno no disponible</strong>
              <span>{{ terrainError }}</span>
              <button type="button" (click)="simulationService.loadTerrainExtent()">Reintentar</button>
            </div>
          }
          @if (simulationService.terrainExtent(); as extent) {
            <div class="terrain-extent-card" aria-label="Extensión del raster de terreno">
              <span class="terrain-extent-card__heading">
                <i class="terrain-extent-card__swatch" aria-hidden="true"></i>
                Extensión del raster de terreno
              </span>
              <span class="terrain-extent-card__bounds">
                Lat {{ extent.southLatitude.toFixed(4) }}° a {{ extent.northLatitude.toFixed(4) }}° ·
                Lon {{ extent.westLongitude.toFixed(4) }}° a {{ extent.eastLongitude.toFixed(4) }}°
              </span>
              <span class="terrain-extent-card__note">
                {{ extent.containsNoDataCells
                  ? 'Hay celdas NoData dentro del raster; el motor las verifica al calcular cada perfil.'
                  : 'No se detectaron celdas NoData, pero el contorno solo representa los límites del GeoTIFF.' }}
              </span>
              @if (extent.noDataValue !== null) {
                <span class="terrain-extent-card__note">Valor NoData: {{ extent.noDataValue }}</span>
              }
              <button type="button" class="terrain-extent-card__view" (click)="fitTerrainExtent()">
                Ver extensión en el mapa
              </button>
            </div>
          }

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

          <div class="coverage-legend-overlay" aria-label="Leyenda RSRP">
            <span class="coverage-legend-overlay__title">RSRP</span>
            <div class="coverage-legend-overlay__scale">
              <span><i style="background:#ef4444"></i>&lt; −100</span>
              <span><i style="background:#f97316"></i>−100/−85</span>
              <span><i style="background:#fbbf24"></i>−85/−70</span>
              <span><i style="background:#10b981"></i>&gt; −70 dBm</span>
            </div>
          </div>

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
          <button
            class="map-control-btn"
            [class.map-control-btn--active]="coveragePointsVisible"
            (click)="toggleCoveragePoints()"
            title="Mostrar/ocultar puntos de cobertura">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="4" cy="6" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="20" cy="6" r="1.5"/>
              <circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/>
              <circle cx="4" cy="18" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="20" cy="18" r="1.5"/>
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
  readonly simulationService = inject(SimulationService);
  comparisonService = inject(ComparisonService);
  mapTileService = inject(MapTileService);
  recommendation = inject(RecommendationService);
  private map!: L.Map;
  private tileLayer?: L.Layer;
  private heatmapLayer: any;
  private heatmapLayerB: any;
  private diffLayerGroup?: L.LayerGroup;
  private terrainExtentLayer?: L.Rectangle;
  private recommendationLayer?: L.LayerGroup;
  private coveragePointsLayer?: L.LayerGroup;
  private txMarker?: L.Marker;
  private txMarkerB?: L.Marker;
  private heatmapVisible = true;
  coveragePointsVisible = true;
  private lastSimId: string | null = null;
  private resizeObserver?: ResizeObserver;

  currentLat?: number;
  currentLon?: number;

  constructor() {
    // Effect principal: heatmap A + centrado en TX cuando cambia la simulación
    effect(() => {
      const simulation = this.simulationService.currentSimulation();
      const draftLocation = this.simulationService.pendingLocation();
      const points = this.visiblePoints();

      if (this.map && !simulation) {
        this.removeHeatmapA();
        this.updateCoveragePoints([]);
        this.clearComparisonLayers();
        if (draftLocation) {
          this.updateTxMarker(draftLocation);
          this.currentLat = draftLocation.latitude;
          this.currentLon = draftLocation.longitude;
        } else if (this.txMarker) {
          this.map.removeLayer(this.txMarker);
          this.txMarker = undefined;
        }
        if (!draftLocation) {
          this.currentLat = undefined;
          this.currentLon = undefined;
        }
        this.lastSimId = null;
        return;
      }

      if (this.map && simulation) {
        this.updateHeatmap(points);
        this.updateCoveragePoints(points);
        const location = draftLocation ?? simulation.metadata.tx_location;
        this.updateTxMarker(location);
        this.currentLat = location.latitude;
        this.currentLon = location.longitude;

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

    effect(() => {
      const extent = this.simulationService.terrainExtent();
      if (this.map) {
        this.updateTerrainExtentLayer(extent);
      }
    });

    effect(() => {
      const result = this.recommendation.result();
      const polygon = this.recommendation.polygon();
      const drawing = this.recommendation.drawing();
      if (this.map) this.updateRecommendationLayer(result, polygon, drawing);
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
      this.updateCoveragePoints(active ? pointsA : this.visiblePoints());

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
    this.updateTerrainExtentLayer(this.simulationService.terrainExtent());
    this.updateRecommendationLayer(this.recommendation.result(), this.recommendation.polygon(), this.recommendation.drawing());

    this.map.on('zoomend', () => {
      if (this.coveragePointsVisible) {
        this.updateCoveragePoints(this.visiblePoints());
      }
    });

    // Click en el mapa → seleccionar punto más cercano
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.simulationService.placingTransmitter()) {
        this.recommendation.placing.set(false);
        this.recommendation.drawing.set(false);
        const location = {
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        };
        this.simulationService.setTransmitterLocation(location);
        this.currentLat = location.latitude;
        this.currentLon = location.longitude;
        this.updateTxMarker(location);
        return;
      }

      if (this.recommendation.placing()) {
        this.recommendation.setCenter({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        return;
      }

      if (this.recommendation.drawing()) {
        this.recommendation.addVertex({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        return;
      }

      const points = this.visiblePoints();
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
    const pendingLocation = this.simulationService.pendingLocation();
    if (simulation) {
      this.updateHeatmap(this.simulationService.filteredCoveragePoints());
      this.updateCoveragePoints(this.visiblePoints());
      const location = pendingLocation ?? simulation.metadata.tx_location;
      this.updateTxMarker(location);
      this.currentLat = location.latitude;
      this.currentLon = location.longitude;
      this.map.setView(
        [simulation.metadata.tx_location.latitude, simulation.metadata.tx_location.longitude],
        14
      );
      this.lastSimId = simulation.simulation_id;
    } else if (pendingLocation) {
      this.updateTxMarker(pendingLocation);
      this.currentLat = pendingLocation.latitude;
      this.currentLon = pendingLocation.longitude;
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
      radius: 13,
      blur: 9,
      maxZoom: 17,
      max: 0.78,
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
          <strong style="color: #00d4aa;">Antena</strong><br>
          <span style="font-family: monospace; font-size: 12px;">
            ${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°
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
    const location = this.simulationService.pendingLocation()
      ?? this.simulationService.currentSimulation()?.metadata.tx_location;
    if (location) {
      this.map.setView(
        [location.latitude, location.longitude],
        14
      );
    }
  }

  fitTerrainExtent(): void {
    const extent = this.simulationService.terrainExtent();
    if (!extent) return;
    this.map.fitBounds(
      [[extent.southLatitude, extent.westLongitude], [extent.northLatitude, extent.eastLongitude]],
      { padding: [24, 24] }
    );
  }

  toggleHeatmap(): void {
    this.heatmapVisible = !this.heatmapVisible;
    if (this.heatmapVisible) {
      this.updateHeatmap(this.simulationService.filteredCoveragePoints());
    } else {
      this.removeHeatmapA();
    }
  }

  toggleCoveragePoints(): void {
    this.coveragePointsVisible = !this.coveragePointsVisible;
    if (this.coveragePointsVisible) {
      this.updateCoveragePoints(this.visiblePoints());
    } else if (this.coveragePointsLayer) {
      this.map.removeLayer(this.coveragePointsLayer);
      this.coveragePointsLayer = undefined;
    }
  }

  private visiblePoints(): CoveragePoint[] {
    return this.simulationService.filteredCoveragePoints();
  }

  private updateCoveragePoints(points: CoveragePoint[]): void {
    if (this.coveragePointsLayer) {
      this.map.removeLayer(this.coveragePointsLayer);
      this.coveragePointsLayer = undefined;
    }
    if (!this.coveragePointsVisible || points.length === 0) return;

    const zoom = this.map.getZoom();
    const radius = zoom >= 16 ? 3.2 : zoom >= 13 ? 2.4 : zoom >= 11 ? 1.6 : 1.1;
    const canvasRenderer = L.canvas({ padding: 0.35 });
    const markers = points.map(point => L.circleMarker(
      [point.latitude, point.longitude],
      {
        renderer: canvasRenderer,
        radius,
        weight: 0.45,
        color: this.rsrpToColor(point.rsrp_dbm),
        fillColor: this.rsrpToColor(point.rsrp_dbm),
        fillOpacity: 0.72,
        opacity: 0
      }
    ).bindTooltip(`${point.rsrp_dbm.toFixed(1)} dBm`, {
      direction: 'top',
      offset: [0, -4],
      opacity: 0.95
    }));

    this.coveragePointsLayer = L.layerGroup(markers).addTo(this.map);
  }

  private updateTerrainExtentLayer(extent: TerrainExtent | null): void {
    if (this.terrainExtentLayer) {
      this.map.removeLayer(this.terrainExtentLayer);
      this.terrainExtentLayer = undefined;
    }
    if (!extent) return;

    this.terrainExtentLayer = L.rectangle(
      [[extent.southLatitude, extent.westLongitude], [extent.northLatitude, extent.eastLongitude]],
      {
        color: '#38bdf8',
        weight: 2,
        opacity: 0.9,
        dashArray: '8 6',
        fillColor: '#38bdf8',
        fillOpacity: 0.025,
        interactive: false
      }
    ).addTo(this.map);
  }

  private updateRecommendationLayer(result: RecommendationResult | null, polygon: Location[], drawing: boolean): void {
    if (this.recommendationLayer) {
      this.map.removeLayer(this.recommendationLayer);
      this.recommendationLayer = undefined;
    }
    const layers: L.Layer[] = [];
    if (polygon.length) {
      const points: L.LatLngExpression[] = polygon.map(p => [p.latitude, p.longitude]);
      if (drawing || polygon.length < 3) {
        layers.push(L.polyline(points, { color: '#fbbf24', weight: 2, interactive: false }));
      } else {
        layers.push(L.polygon(points, { color: '#fbbf24', weight: 2, fillOpacity: 0.06, interactive: false }));
      }
      polygon.forEach(p => layers.push(L.circleMarker([p.latitude, p.longitude],
        { radius: 4, color: '#fbbf24', fillOpacity: 1, interactive: false })));
    }
    if (result && !result.request.polygon) {
      const r = result.request;
      const dlat = r.areaKm / 222;
      const dlon = dlat / Math.cos(r.latitude * Math.PI / 180);
      layers.push(L.rectangle([[r.latitude - dlat, r.longitude - dlon], [r.latitude + dlat, r.longitude + dlon]],
        { color: '#fbbf24', weight: 2, fillOpacity: 0.03, interactive: false }));
    }
    result?.sites.forEach((site, index) => {
      layers.push(L.circleMarker([site.latitude, site.longitude],
        { radius: 8, color: '#fff', weight: 2, fillColor: '#f59e0b', fillOpacity: 1 })
        .bindTooltip(`Nodo ${index + 1}: +${site.newlyCovered}, acumulado ${site.cumulativeCovered}`));
    });
    if (layers.length) this.recommendationLayer = L.layerGroup(layers).addTo(this.map);
  }

  private rsrpToColor(rsrp: number): string {
    if (rsrp >= -70) return '#10B981';
    if (rsrp >= -85) return '#FBBF24';
    if (rsrp >= -100) return '#F97316';
    return '#EF4444';
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
