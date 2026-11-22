import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Location } from '../models/simulation.model';

export interface RecommendationRequest {
  latitude: number; longitude: number; areaKm: number; candidateSide: number;
  targetSide: number; nodes: number; thresholdDbm: number; frequencyGHz: number;
  txHeightM: number; rxHeightM: number; txPowerDbm: number; txGainDbi: number; cableLossDb: number;
  polygon?: Location[];
}
export interface RecommendationResult {
  request: RecommendationRequest; model: string; candidateCount: number; targetCount: number;
  linkCount: number; maxProfileSamples: number; coveredTargets: number;
  sites: { latitude: number; longitude: number; newlyCovered: number; cumulativeCovered: number }[];
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);
  readonly placing = signal(false);
  readonly drawing = signal(false);
  readonly polygon = signal<Location[]>([]);
  readonly center = signal<Location | null>(null);
  readonly result = signal<RecommendationResult | null>(null);
  readonly running = signal(false);
  readonly error = signal<string | null>(null);
  private revision = 0;

  clear(): void {
    this.revision++;
    this.result.set(null);
    this.error.set(null);
  }
  setCenter(location: Location): void {
    this.clear();
    this.center.set(location);
    this.placing.set(false);
  }
  startDrawing(): void {
    this.clear();
    this.placing.set(false);
    this.polygon.set([]);
    this.drawing.set(true);
  }
  addVertex(location: Location): void {
    if (this.polygon().length >= 100) {
      this.error.set('El polígono admite como máximo 100 vértices.');
      return;
    }
    this.clear();
    this.polygon.update(points => [...points, location]);
  }
  async calculate(request: RecommendationRequest): Promise<void> {
    if (this.running()) return;
    this.clear();
    const revision = this.revision;
    this.running.set(true);
    try {
      const result = await firstValueFrom(this.http.post<RecommendationResult>(
        'http://localhost:8080/api/recommendations', request));
      if (revision === this.revision) this.result.set(result);
    } catch (error) {
      if (revision === this.revision) {
        const detail: unknown = error instanceof HttpErrorResponse ? error.error?.detail : null;
        this.error.set(typeof detail === 'string' ? detail : 'No se pudo calcular la recomendación. Comprueba el backend y el raster.');
      }
    } finally {
      this.running.set(false);
    }
  }
}
