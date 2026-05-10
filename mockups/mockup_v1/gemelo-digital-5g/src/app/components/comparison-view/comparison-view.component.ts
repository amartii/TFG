import { Component, OnInit, OnDestroy, inject, effect, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';
import { ComparisonService } from '../../services/comparison.service';
import { MapTileService } from '../../services/map-tile.service';
import { RSRP_LEVELS } from '../../models/simulation.model';
import * as L from 'leaflet';
import 'leaflet.heat';

@Component({
  selector: 'app-comparison-view',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="comparison-layout">
      <!-- Header de comparación -->
      <div class="comparison-header">
        <div class="comparison-header__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
          </svg>
          Comparación de Simulaciones
        </div>
        <button class="comparison-header__close" (click)="comparisonService.stopComparison()">
          ✕ Cerrar
        </button>
      </div>

      <!-- Contenido: dos mapas + dashboard central -->
      <div class="comparison-body">
        <!-- Mapa A -->
        <div class="map-panel">
          <div class="map-panel__header">
            <span class="badge badge--a">A</span>
            <span class="map-panel__name">{{ simAName() }}</span>
          </div>
          <div class="map-panel__map-wrap">
            <div id="comparison-map-a" class="map-panel__map"></div>
            <div class="cmp-theme-selector">
              @for (theme of mapTileService.themes; track theme.id) {
                <button
                  class="cmp-theme-btn"
                  [class.cmp-theme-btn--active]="theme.id === themeIdA()"
                  [title]="theme.name + ' — ' + theme.description"
                  (click)="setThemeA(theme.id)">
                  @switch (theme.id) {
                    @case ('osm') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                    }
                    @case ('satellite') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    }
                    @case ('terrain') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20l5-9 4 7 3-5 6 7H3z"/><circle cx="17" cy="6" r="2"/></svg>
                    }
                  }
                </button>
              }
            </div>
          </div>
          <div class="map-panel__stats">
            @if (statsA()) {
              <div class="mini-stat"><span class="mini-stat__val font-mono">{{ statsA()!.avg | number:'1.1-1' }}</span><span class="mini-stat__lbl">dBm medio</span></div>
              <div class="mini-stat"><span class="mini-stat__val font-mono">{{ statsA()!.max | number:'1.1-1' }}</span><span class="mini-stat__lbl">máx</span></div>
              <div class="mini-stat"><span class="mini-stat__val font-mono">{{ statsA()!.min | number:'1.1-1' }}</span><span class="mini-stat__lbl">mín</span></div>
              <div class="mini-stat"><span class="mini-stat__val font-mono">{{ statsA()!.points }}</span><span class="mini-stat__lbl">puntos</span></div>
            }
          </div>
        </div>

        <!-- Dashboard central -->
        <div class="dashboard">
          <!-- Delta principal -->
          <div class="dashboard__section">
            <h4 class="dashboard__title">Diferencia (A − B)</h4>
            @if (diffStats()) {
              <div class="delta-display"
                   [class.delta-display--positive]="diffStats()!.avgDelta > 0"
                   [class.delta-display--negative]="diffStats()!.avgDelta < 0">
                <span class="delta-display__value">{{ diffStats()!.avgDelta > 0 ? '+' : '' }}{{ diffStats()!.avgDelta | number:'1.1-1' }}</span>
                <span class="delta-display__unit">dB medio</span>
              </div>
              @if (diffStats()!.hasSpatialOverlap) {
                <div class="delta-range">
                  <div class="delta-range__item">
                    <span class="delta-range__label">Máx Δ</span>
                    <span class="delta-range__value font-mono" style="color:#f97316">+{{ diffStats()!.maxDelta | number:'1.1-1' }}</span>
                  </div>
                  <div class="delta-range__item">
                    <span class="delta-range__label">Mín Δ</span>
                    <span class="delta-range__value font-mono" style="color:#3b82f6">{{ diffStats()!.minDelta | number:'1.1-1' }}</span>
                  </div>
                </div>
              } @else {
                <div class="dashboard__hint">Sin solapamiento espacial — comparación por estadísticas agregadas</div>
              }
            } @else {
              <div class="dashboard__empty">Cargando comparación…</div>
            }
          </div>

          <!-- Ventaja por zona (solo cuando hay solapamiento espacial) -->
          @if (diffStats() && diffStats()!.hasSpatialOverlap) {
            <div class="dashboard__section">
              <h4 class="dashboard__title">Ventaja por zona</h4>
              <div class="advantage-bars">
                <div class="advantage-row">
                  <span class="advantage-label" style="color:#f97316">A mejor</span>
                  <div class="advantage-bar-track">
                    <div class="advantage-bar advantage-bar--a"
                         [style.width.%]="(diffStats()!.aBetterCount / diffStats()!.totalMatched) * 100"></div>
                  </div>
                  <span class="advantage-count font-mono">{{ diffStats()!.aBetterCount }}</span>
                </div>
                <div class="advantage-row">
                  <span class="advantage-label" style="color:#6b7280">≈ Igual</span>
                  <div class="advantage-bar-track">
                    <div class="advantage-bar advantage-bar--equal"
                         [style.width.%]="(diffStats()!.similarCount / diffStats()!.totalMatched) * 100"></div>
                  </div>
                  <span class="advantage-count font-mono">{{ diffStats()!.similarCount }}</span>
                </div>
                <div class="advantage-row">
                  <span class="advantage-label" style="color:#3b82f6">B mejor</span>
                  <div class="advantage-bar-track">
                    <div class="advantage-bar advantage-bar--b"
                         [style.width.%]="(diffStats()!.bBetterCount / diffStats()!.totalMatched) * 100"></div>
                  </div>
                  <span class="advantage-count font-mono">{{ diffStats()!.bBetterCount }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Distribución de cobertura comparada -->
          @if (statsA() && statsB()) {
            <div class="dashboard__section">
              <h4 class="dashboard__title">Calidad de cobertura</h4>
              <div class="coverage-compare">
                @for (level of rsrpLevels; track level.label) {
                  <div class="coverage-row">
                    <span class="coverage-row__swatch" [style.background]="level.color"></span>
                    <span class="coverage-row__label">{{ level.label }}</span>
                    <div class="coverage-row__bars">
                      <div class="coverage-mini-bar coverage-mini-bar--a"
                           [style.width.%]="getLevelPercent('A', level.min, level.max)"></div>
                      <div class="coverage-mini-bar coverage-mini-bar--b"
                           [style.width.%]="getLevelPercent('B', level.min, level.max)"></div>
                    </div>
                    <span class="coverage-row__vals font-mono">
                      {{ getLevelPercent('A', level.min, level.max) | number:'1.0-0' }}
                      / {{ getLevelPercent('B', level.min, level.max) | number:'1.0-0' }}%
                    </span>
                  </div>
                }
              </div>
            </div>

            <!-- Tabla de parámetros -->
            <div class="dashboard__section">
              <h4 class="dashboard__title">Parámetros</h4>
              <div class="params-table">
                <div class="params-row params-row--header">
                  <span></span><span class="badge badge--a" style="font-size:10px">A</span><span class="badge badge--b" style="font-size:10px">B</span>
                </div>
                <div class="params-row">
                  <span>Frecuencia</span>
                  <span class="font-mono">{{ simA()!.metadata.frequency_ghz }} GHz</span>
                  <span class="font-mono">{{ simB()!.metadata.frequency_ghz }} GHz</span>
                </div>
                <div class="params-row">
                  <span>Potencia</span>
                  <span class="font-mono">{{ simA()!.metadata.tx_power_dbm }} dBm</span>
                  <span class="font-mono">{{ simB()!.metadata.tx_power_dbm }} dBm</span>
                </div>
                <div class="params-row">
                  <span>Altura</span>
                  <span class="font-mono">{{ simA()!.metadata.antenna_height_m }} m</span>
                  <span class="font-mono">{{ simB()!.metadata.antenna_height_m }} m</span>
                </div>
                <div class="params-row">
                  <span>Modelo</span>
                  <span class="font-mono" style="font-size:9px">{{ simA()!.metadata.model }}</span>
                  <span class="font-mono" style="font-size:9px">{{ simB()!.metadata.model }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Mapa B -->
        <div class="map-panel">
          <div class="map-panel__header">
            <span class="badge badge--b">B</span>
            <span class="map-panel__name">{{ simBName() }}</span>
          </div>
          <div class="map-panel__map-wrap">
            <div id="comparison-map-b" class="map-panel__map"></div>
            <div class="cmp-theme-selector">
              @for (theme of mapTileService.themes; track theme.id) {
                <button
                  class="cmp-theme-btn"
                  [class.cmp-theme-btn--active]="theme.id === themeIdB()"
                  [title]="theme.name + ' — ' + theme.description"
                  (click)="setThemeB(theme.id)">
                  @switch (theme.id) {
                    @case ('osm') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                    }
                    @case ('satellite') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    }
                    @case ('terrain') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20l5-9 4 7 3-5 6 7H3z"/><circle cx="17" cy="6" r="2"/></svg>
                    }
                  }
                </button>
              }
            </div>
          </div>
          <div class="map-panel__stats">
            @if (statsB()) {
              <div class="mini-stat"><span class="mini-stat__val font-mono">{{ statsB()!.avg | number:'1.1-1' }}</span><span class="mini-stat__lbl">dBm medio</span></div>
              <div class="mini-stat"><span class="mini-stat__val font-mono">{{ statsB()!.max | number:'1.1-1' }}</span><span class="mini-stat__lbl">máx</span></div>
              <div class="mini-stat"><span class="mini-stat__val font-mono">{{ statsB()!.min | number:'1.1-1' }}</span><span class="mini-stat__lbl">mín</span></div>
              <div class="mini-stat"><span class="mini-stat__val font-mono">{{ statsB()!.points }}</span><span class="mini-stat__lbl">puntos</span></div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './comparison-view.component.scss'
})
export class ComparisonViewComponent implements OnInit, OnDestroy {
  private simulationService = inject(SimulationService);
  comparisonService = inject(ComparisonService);
  mapTileService = inject(MapTileService);

  private mapA!: L.Map;
  private mapB!: L.Map;
  private tileLayerA?: L.Layer;
  private tileLayerB?: L.Layer;
  private heatLayerA: any;
  private heatLayerB: any;
  private txMarkerA?: L.Marker;
  private txMarkerB?: L.Marker;
  private resizeObserver?: ResizeObserver;

  // Tema del mapa independiente para A y B (parten del global, luego cada selector
  // los modifica de forma autónoma).
  themeIdA = signal<string>(this.mapTileService.current().id);
  themeIdB = signal<string>(this.mapTileService.current().id);

  setThemeA(id: string): void { this.themeIdA.set(id); }
  setThemeB(id: string): void { this.themeIdB.set(id); }

  rsrpLevels = RSRP_LEVELS;

  simA = computed(() => this.simulationService.currentSimulation());
  simB = computed(() => this.comparisonService.simulationB());
  simAName = computed(() => this.simA()?.metadata?.scenario_name || 'Simulación A');
  simBName = computed(() => this.simB()?.metadata?.scenario_name || 'Simulación B');
  diffStats = computed(() => this.comparisonService.diffStats());

  statsA = computed(() => {
    const sim = this.simA();
    if (!sim || sim.coverage_points.length === 0) return null;
    const rsrps = sim.coverage_points.map(p => p.rsrp_dbm);
    return {
      avg: rsrps.reduce((a, b) => a + b, 0) / rsrps.length,
      min: Math.min(...rsrps),
      max: Math.max(...rsrps),
      points: sim.coverage_points.length
    };
  });

  statsB = computed(() => {
    const sim = this.simB();
    if (!sim || sim.coverage_points.length === 0) return null;
    const rsrps = sim.coverage_points.map(p => p.rsrp_dbm);
    return {
      avg: rsrps.reduce((a, b) => a + b, 0) / rsrps.length,
      min: Math.min(...rsrps),
      max: Math.max(...rsrps),
      points: sim.coverage_points.length
    };
  });

  constructor() {
    // Effect: cambio de tema del mapa A
    effect(() => {
      const themeId = this.themeIdA();
      if (this.mapA) {
        if (this.tileLayerA) this.mapA.removeLayer(this.tileLayerA);
        this.tileLayerA = this.mapTileService.createTileLayer(themeId);
        this.tileLayerA.addTo(this.mapA);
      }
    });

    // Effect: cambio de tema del mapa B (independiente de A)
    effect(() => {
      const themeId = this.themeIdB();
      if (this.mapB) {
        if (this.tileLayerB) this.mapB.removeLayer(this.tileLayerB);
        this.tileLayerB = this.mapTileService.createTileLayer(themeId);
        this.tileLayerB.addTo(this.mapB);
      }
    });

    effect(() => {
      const simA = this.simA();
      if (this.mapA && simA && simA.coverage_points.length > 0) {
        this.renderHeatmap(this.mapA, simA.coverage_points, 'A');
        this.renderTxMarker(this.mapA, simA.metadata.tx_location, 'A');
      }
    });

    effect(() => {
      const simB = this.simB();
      if (this.mapB && simB && simB.coverage_points.length > 0) {
        this.renderHeatmap(this.mapB, simB.coverage_points, 'B');
        this.renderTxMarker(this.mapB, simB.metadata.tx_location, 'B');
        const bounds = L.latLngBounds(simB.coverage_points.map(p => [p.latitude, p.longitude] as [number, number]));
        this.mapB.fitBounds(bounds, { padding: [20, 20] });
      }
    });
  }

  ngOnInit(): void {
    setTimeout(() => this.initMaps(), 100);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.mapA) this.mapA.remove();
    if (this.mapB) this.mapB.remove();
  }

  private initMaps(): void {
    const center: L.LatLngExpression = [40.2897, -3.8244];

    this.mapA = L.map('comparison-map-a', { center, zoom: 13, zoomControl: false, attributionControl: false });
    this.tileLayerA = this.mapTileService.createTileLayer(this.themeIdA());
    this.tileLayerA.addTo(this.mapA);

    this.mapB = L.map('comparison-map-b', { center, zoom: 13, zoomControl: false, attributionControl: false });
    this.tileLayerB = this.mapTileService.createTileLayer(this.themeIdB());
    this.tileLayerB.addTo(this.mapB);

    // Render initial data for A
    const simA = this.simA();
    if (simA && simA.coverage_points.length > 0) {
      this.renderHeatmap(this.mapA, simA.coverage_points, 'A');
      this.renderTxMarker(this.mapA, simA.metadata.tx_location, 'A');
      const bounds = L.latLngBounds(simA.coverage_points.map(p => [p.latitude, p.longitude] as [number, number]));
      this.mapA.fitBounds(bounds, { padding: [20, 20] });
    }

    const simB = this.simB();
    if (simB && simB.coverage_points.length > 0) {
      this.renderHeatmap(this.mapB, simB.coverage_points, 'B');
      this.renderTxMarker(this.mapB, simB.metadata.tx_location, 'B');
      const bounds = L.latLngBounds(simB.coverage_points.map(p => [p.latitude, p.longitude] as [number, number]));
      this.mapB.fitBounds(bounds, { padding: [20, 20] });
    }

    // Forzar a Leaflet a recalcular dimensiones cuando el host alcance su tamaño final
    requestAnimationFrame(() => {
      this.mapA.invalidateSize();
      this.mapB.invalidateSize();
    });

    // Recalcular si el contenedor cambia de tamaño (resize ventana, sidebar, etc.)
    const containerA = document.getElementById('comparison-map-a');
    const containerB = document.getElementById('comparison-map-b');
    if (containerA && containerB && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.mapA?.invalidateSize();
        this.mapB?.invalidateSize();
      });
      this.resizeObserver.observe(containerA);
      this.resizeObserver.observe(containerB);
    }
  }

  private renderHeatmap(map: L.Map, points: { latitude: number; longitude: number; rsrp_dbm: number }[], which: 'A' | 'B'): void {
    const existing = which === 'A' ? this.heatLayerA : this.heatLayerB;
    if (existing) { map.removeLayer(existing); }

    const heatData: [number, number, number][] = points.map(p => [
      p.latitude, p.longitude, this.simulationService.normalizeRsrp(p.rsrp_dbm)
    ]);

    const layer = (L as any).heatLayer(heatData, {
      radius: 18, blur: 15, maxZoom: 17, max: 1.0,
      gradient: { 0.0: '#ef4444', 0.4: '#f97316', 0.55: '#fbbf24', 0.7: '#10b981' }
    });
    layer.addTo(map);

    if (which === 'A') this.heatLayerA = layer;
    else this.heatLayerB = layer;
  }

  private renderTxMarker(map: L.Map, location: { latitude: number; longitude: number }, which: 'A' | 'B'): void {
    const existing = which === 'A' ? this.txMarkerA : this.txMarkerB;
    if (existing) map.removeLayer(existing);

    const color = which === 'A' ? '#f97316' : '#3b82f6';
    const icon = L.divIcon({
      className: 'tx-marker-cmp',
      html: `<div style="color:${color};filter:drop-shadow(0 0 6px ${color}80);width:32px;height:32px;">
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <path d="M12 2L12 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          <path d="M5 8L12 2L19 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="2" r="3" fill="currentColor"/>
        </svg></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = L.marker([location.latitude, location.longitude], { icon }).addTo(map);
    if (which === 'A') this.txMarkerA = marker;
    else this.txMarkerB = marker;
  }

  getLevelPercent(sim: 'A' | 'B', min: number, max: number): number {
    const data = sim === 'A' ? this.simA() : this.simB();
    if (!data || data.coverage_points.length === 0) return 0;
    const count = data.coverage_points.filter(p => p.rsrp_dbm >= min && p.rsrp_dbm < max).length;
    return (count / data.coverage_points.length) * 100;
  }
}
