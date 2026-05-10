# Descarga del tile SRTM para Fuenlabrada

## Tile necesario
- **Tile:** N40W004
- **Cobertura:** Lat 40°–41°N, Lon 4°–3°W (incluye URJC Fuenlabrada)
- **Resolución:** 1 Arc-Second (~30 m)
- **Nombre de fichero esperado:** `srtm_fuenlabrada.tif`

---

## Pasos de descarga (USGS EarthExplorer)

1. Ir a **https://earthexplorer.usgs.gov/** (requiere cuenta gratuita)
2. En *Search Criteria > Coordinates*, introducir:
   - Lat: `40.2897`  Lon: `-3.8244`
3. Hacer clic en **Data Sets**
4. Expandir: `Digital Elevation > SRTM > SRTM 1 Arc-Second Global`
5. Hacer clic en **Results**
6. Localizar el tile **N40W004** y pulsar el icono de descarga (nube)
7. Descargar el archivo `.tif` (formato GeoTIFF)

## Alternativa rápida (sin cuenta)

OpenTopography ofrece descarga directa por bbox:
```
https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1
```
Definir bbox: South=40.2, North=40.4, West=-3.9, East=-3.7

---

## Instalación

Renombrar el archivo descargado a `srtm_fuenlabrada.tif` y copiarlo en esta carpeta:

```
matlab/data/srtm_fuenlabrada.tif   ← aquí
```

El script `simulacion_cobertura_5g.m` lo detectará automáticamente en el Block 3.

---

## Verificación en MATLAB

```matlab
[elev, R] = readgeoraster('data/srtm_fuenlabrada.tif');
disp(R)          % debe mostrar el referencial geográfico WGS-84
imagesc(elev)    % mapa de elevación de la zona
```

Rango de elevación esperado para Fuenlabrada: **550–680 m** sobre el nivel del mar.
