import { Component, OnInit, OnDestroy, inject, effect, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SimulationService } from '../../services/simulation.service';
import { ComparisonService } from '../../services/comparison.service';
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
          <div id="comparison-map-a" class="map-panel__map"></div>
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
              <div class="dashboard__empty">Selecciona simulación B en el sidebar</div>
            }
          </div>

          <!-- Ventaja por zona -->
          @if (diffStats()) {
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
          <div id="comparison-map-b" class="map-panel__map"></div>
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

  private mapA!: L.Map;
  private mapB!: L.Map;
  private heatLayerA: any;
  private heatLayerB: any;
  private txMarkerA?: L.Marker;
  private txMarkerB?: L.Marker;
  private syncing = false;

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
    if (this.mapA) this.mapA.remove();
    if (this.mapB) this.mapB.remove();
  }

  private initMaps(): void {
    const center: L.LatLngExpression = [40.2897, -3.8244];
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const tileOpts: L.TileLayerOptions = { subdomains: 'abcd', maxZoom: 19 };

    this.mapA = L.map('comparison-map-a', { center, zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer(tileUrl, tileOpts).addTo(this.mapA);

    this.mapB = L.map('comparison-map-b', { center, zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer(tileUrl, tileOpts).addTo(this.mapB);

    // Sync pan/zoom between both maps
    this.mapA.on('move', () => this.syncMap(this.mapA, this.mapB));
    this.mapB.on('move', () => this.syncMap(this.mapB, this.mapA));

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
    }
  }

  private syncMap(source: L.Map, target: L.Map): void {
    if (this.syncing) return;
    this.syncing = true;
    target.setView(source.getCenter(), source.getZoom(), { animate: false });
    this.syncing = false;
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
