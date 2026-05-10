import { Injectable, signal, computed } from '@angular/core';
import * as L from 'leaflet';
import * as protomapsL from 'protomaps-leaflet';

export type MapTileKind = 'raster' | 'vector';

export interface MapTileTheme {
  id: string;
  name: string;
  description: string;
  kind: MapTileKind;
  /** Para raster: URL template tipo {s}/{z}/{x}/{y}. Para vector: URL del .pmtiles */
  url: string;
  /** Estilo de Protomaps (solo para vector): 'light', 'dark', 'white', 'black', 'grayscale' */
  protomapsTheme?: 'light' | 'dark' | 'white' | 'black' | 'grayscale';
  options?: L.TileLayerOptions;
}

/**
 * Si hay un fichero local `assets/tiles/spain.pmtiles` (ver scripts/download-pmtiles.ps1)
 * se usará ese; si no, se cae al CDN público de Protomaps.
 *
 * El CDN sirve tiles del mundo entero sobre HTTP range requests, así que también es válido
 * en producción. La ventaja del fichero local es la latencia (0 ms vs ~80 ms por tile).
 */
const PMTILES_LOCAL = 'assets/tiles/spain.pmtiles';
const PMTILES_REMOTE = 'https://demo-bucket.protomaps.com/v4.pmtiles';

export const MAP_THEMES: MapTileTheme[] = [
  {
    id: 'osm',
    name: 'Estándar',
    description: 'OpenStreetMap raster',
    kind: 'raster',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abc',
      maxZoom: 19
    }
  },
  {
    id: 'satellite',
    name: 'Satélite',
    description: 'ESRI World Imagery (raster)',
    kind: 'raster',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; ESRI',
      maxZoom: 19
    }
  },
  {
    id: 'terrain',
    name: 'Terreno',
    description: 'OpenTopoMap raster (relieve)',
    kind: 'raster',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      subdomains: 'abc',
      maxZoom: 17
    }
  }
];

@Injectable({ providedIn: 'root' })
export class MapTileService {
  private readonly STORAGE_KEY = 'gd5g-map-theme';
  private currentId = signal<string>(MAP_THEMES[0].id);
  /** Cache: si ya hemos comprobado que el fichero local existe, lo recordamos. */
  private localPmtilesAvailable: boolean | null = null;

  readonly themes = MAP_THEMES;
  readonly current = computed(() =>
    MAP_THEMES.find(t => t.id === this.currentId()) ?? MAP_THEMES[0]
  );

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && MAP_THEMES.some(t => t.id === saved)) {
      this.currentId.set(saved);
    }
  }

  setTheme(id: string): void {
    if (!MAP_THEMES.some(t => t.id === id)) return;
    this.currentId.set(id);
    localStorage.setItem(this.STORAGE_KEY, id);
  }

  /**
   * Crea una capa de tiles (raster o vector) lista para añadir a un L.Map.
   * Para vector usa protomaps-leaflet que renderiza PMTiles en Canvas;
   * permite seguir usando leaflet.heat sin cambios.
   */
  createTileLayer(themeId?: string): L.Layer {
    const theme = themeId
      ? MAP_THEMES.find(t => t.id === themeId) ?? this.current()
      : this.current();

    if (theme.kind === 'raster') {
      return L.tileLayer(theme.url, theme.options);
    }

    // Vector (PMTiles via protomaps-leaflet)
    const pmtilesUrl = this.resolvePmtilesUrl(theme.url);
    return (protomapsL as any).leafletLayer({
      url: pmtilesUrl,
      theme: theme.protomapsTheme ?? 'light',
      attribution: '&copy; <a href="https://protomaps.com">Protomaps</a> &copy; <a href="https://openstreetmap.org">OSM</a>'
    });
  }

  /**
   * Si el fichero local no se ha podido descargar todavía, usamos el CDN remoto.
   * Comprobación lazy: hacemos un HEAD una sola vez por sesión.
   */
  private resolvePmtilesUrl(localUrl: string): string {
    if (this.localPmtilesAvailable === false) return PMTILES_REMOTE;
    if (this.localPmtilesAvailable === true) return localUrl;

    // Por defecto intentamos el local (protomaps lo gestionará y fallará silenciosamente
    // mostrando un mapa vacío). Para una primera comprobación, hacemos un HEAD asíncrono.
    fetch(localUrl, { method: 'HEAD' })
      .then(r => { this.localPmtilesAvailable = r.ok; })
      .catch(() => { this.localPmtilesAvailable = false; });
    return localUrl;
  }
}
