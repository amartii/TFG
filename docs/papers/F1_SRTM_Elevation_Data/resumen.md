# SRTM 1 Arc-Second Global Elevation Dataset

## Datos bibliográficos
- **Organización:** NASA / USGS (U.S. Geological Survey)
- **Año:** Misión SRTM: febrero de 2000; publicación datos 1-arcsec globales: 2014–2015
- **Tipo:** Dataset de elevación digital global (DEM — Digital Elevation Model)
- **DOI:** 10.5066/F7PR7TFT
- **URL de descarga:** https://earthexplorer.usgs.gov/
- **Acceso alternativo:** https://dwtkns.com/srtm30m/ (selector interactivo de tiles)
- **Formato:** GeoTIFF o HGT (SRTM Height), proyección WGS84, resolución 30m (~1 arc-second)

## Relevancia para el TFG
El dataset SRTM es la fuente de datos de elevación del terreno que alimenta el motor de propagación ITM del TFG. Sin un Modelo Digital de Elevación (DEM) preciso, el cálculo de cobertura con el modelo Longley-Rice no tiene ninguna base: el perfil de terreno PFL entre transmisor y receptor se construye directamente a partir de los datos SRTM.

Para el área de interés del TFG (España), el tile relevante es N40W004 (latitud 40°N, longitud 4°W), que cubre la zona del Sistema Central (Sierra de Guadarrama, Sierra de Gredos) y el entorno de Madrid — región geográficamente representativa para un despliegue táctico en terreno irregular. La resolución de 30 metros por píxel (1 arc-second) es adecuada para cálculos de cobertura a escala de pocas decenas de kilómetros, aunque introduce errores de digitalización para terreno muy abrupto.

El SRTM es también el dataset usado por SPLAT! (E1) y CloudRF (E2), lo que hace que las comparaciones entre el TFG y estas herramientas sean directamente válidas al usar los mismos datos de terreno.

## Conceptos clave
- **SRTM (Shuttle Radar Topography Mission):** Misión del transbordador espacial Endeavour (febrero 2000) que cartografió la elevación del terreno con interferometría radar SAR
- **Resolución 1 arc-second (~30m):** Cada píxel del DEM representa aproximadamente 30m × 30m de terreno; resolución estándar para propagación RF
- **Resolución 3 arc-second (~90m):** Versión de menor resolución, disponible globalmente; suficiente para modelos de área
- **Formato HGT:** Archivo binario de 16 bits por sample, big-endian; tile de 1°×1° = 3601×3601 samples (para 1 arc-sec)
- **Formato GeoTIFF:** Alternativa al HGT; proyección WGS84, directamente importable en MATLAB con readgeoraster()
- **Tile N40W004:** Zona de 40°N a 41°N y 4°W a 3°W; cubre parte de Castilla-La Mancha, Madrid y Sistema Central
- **Void/nodata:** El SRTM tiene zonas sin datos (nodata = −32768) en superficies de agua y algunas áreas polares; requieren interpolación o máscara
- **MATLAB readgeoraster():** Función de MATLAB Mapping Toolbox para leer GeoTIFF/HGT directamente como matriz de elevaciones

## Cómo usar en la memoria
- **Sección:** 3.x — Fuentes de datos y preprocesamiento del DEM
- **Propósito:** Citar como fuente oficial de datos de elevación. Describir el proceso de descarga, el tile usado y el preprocesamiento en MATLAB (lectura, recorte al área de interés, extracción de perfiles de elevación).

## Notas de lectura
> DESCARGA: Registrarse en https://earthexplorer.usgs.gov/ (registro gratuito USGS).
> Seleccionar: Digital Elevation → SRTM → SRTM 1 Arc-Second Global
> Tile necesario: N40W004 (buscar por coordenadas: lat 40, lon -4)
> Archivos: N40W004.hgt.zip (~25 MB) o GeoTIFF equivalente
>
> Descarga alternativa más rápida (sin registro):
> https://dwtkns.com/srtm30m/ → hacer click en el tile N40W004
> O bien: https://srtm.csi.cgiar.org/ (CGIAR-CSI SRTM v4.1)
>
> En MATLAB:
> [Z, R] = readgeoraster('N40W004.hgt');
> info = georasterinfo('N40W004.hgt');

## Cita BibTeX
```bibtex
@misc{SRTM_Dataset,
  author       = {{NASA/METI/AIST/Japan Spacesystems and U.S./Japan ASTER Science Team}},
  title        = {{SRTM} 1 Arc-Second Global Elevation Dataset},
  year         = {2014},
  publisher    = {NASA EOSDIS Land Processes DAAC},
  doi          = {10.5066/F7PR7TFT},
  url          = {https://earthexplorer.usgs.gov/},
  note         = {30-meter resolution global DEM derived from the Shuttle Radar Topography Mission (February 2000). Tile N40W004 used for the TFG study area.}
}
```
