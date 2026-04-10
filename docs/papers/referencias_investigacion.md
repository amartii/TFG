# Referencias e Investigación — Gemelo Digital 5G

**TFG:** Diseño e Implementación de una Herramienta de Gemelo Digital para la Planificación y
Visualización de Cobertura en Redes 5G Tácticas Desplegables
**Autor:** Álvaro Martínez Téllez | **Curso:** 2025-2026

---

## Cómo buscar estos papers

- **IEEE Xplore:** https://ieeexplore.ieee.org
- **Google Scholar:** https://scholar.google.com
- **ResearchGate:** https://www.researchgate.net
- Buscar por DOI directamente en la barra del navegador: `doi.org/<DOI>`

---

## BLOQUE A — Modelo de Propagación Longley-Rice (ITM)

### A1. Artículo fundacional del modelo
**Título:** Prediction of Tropospheric Radio Transmission Loss over Irregular Terrain
**Autores:** Longley, A.G.; Rice, P.L.
**Publicación:** ESSA Technical Report ERL 79-ITS 67, NTIA/ITS (1968)
**Relevancia:** Artículo original del modelo Longley-Rice / Irregular Terrain Model (ITM).
Define las bases matemáticas del modelo que usamos en el motor MATLAB.
**Acceso:** Dominio público — https://www.its.bldrdoc.gov/media/50676/TRlong-rice.pdf
**Usar en TFG:** Sección 2.3 (Modelos de Propagación) como referencia primaria del modelo.

---

### A2. Implementación de referencia NTIA/ITS (código C)
**Título:** Irregular Terrain Model (ITM) — Reference Implementation
**Organización:** NTIA/ITS (Institute for Telecommunication Sciences)
**Repositorio:** https://github.com/NTIA/itm
**Relevancia:** Código fuente C++ del ITM. Puede portarse a MATLAB via MEX o llamarse
vía `system()`. Base para implementar Longley-Rice en el motor MATLAB del TFG.
**Buscar en:** GitHub NTIA/itm — documentación técnica en docs/

---

### A3. Comparativa de modelos de propagación para 5G FR1
**Título:** Empirical Path Loss Models for 5G NR at 3.5 GHz in Urban Macrocell Scenarios
**Buscar en IEEE Xplore con:** "path loss model 3.5 GHz urban 5G NR measurement"
**Relevancia:** Compara COST-231, Okumura-Hata y modelos 3GPP TR 38.901 con mediciones
reales en bandas FR1. Útil para validar qué modelo elegir y cuantificar el error.
**Usar en TFG:** Sección 2.3 — justificación de la elección de Longley-Rice vs otros modelos.

---

### A4. Validación del modelo ITM con mediciones reales
**Título:** Validation of the Longley-Rice Model in the VHF and UHF Bands
**Buscar en:** IEEE Transactions on Antennas and Propagation / Google Scholar
**DOI sugerido:** buscar "Longley-Rice validation measurement campaign"
**Relevancia:** Cuantifica el error medio del modelo LR en función del tipo de terreno.
Permite establecer expectativas realistas sobre la precisión de la simulación.

---

## BLOQUE B — Redes 5G FR1 y Parámetros de Planificación

### B1. Estándar 3GPP TS 38.104 — Bandas FR1
**Título:** NR; Base Station (BS) Radio Transmission and Reception
**Organización:** 3GPP
**Número:** TS 38.104 v17.x (2022-2024)
**Acceso:** https://www.3gpp.org/ftp/Specs/archive/38_series/38.104/
**Relevancia DIRECTA para MATLAB:**
- Tabla 5.4.2.1-1: bandas de operación NR (banda n78 = 3.4–3.8 GHz)
- Tabla 5.4.3.3-2: número de Resource Blocks (NRB) por ancho de banda y SCS
  → **n78, BW=100 MHz, SCS=30 kHz → NRB=66** (usado en cálculo RSRP del script)
- Define los parámetros de referencia para RSRP, SINR, RSRQ
**Usar en TFG:** Sección 2.1 y como fuente de los parámetros del Bloque 5 de MATLAB.

---

### B2. Estándar 3GPP TR 38.901 — Modelo de Canal 5G
**Título:** Study on Channel Model for Frequencies from 0.5 to 100 GHz
**Organización:** 3GPP
**Número:** TR 38.901 v17.x (2022)
**Acceso:** https://www.3gpp.org/ftp/Specs/archive/38_series/38.901/
**Relevancia:** Define los parámetros estadísticos del canal 5G NR para escenarios
UMa (Urban Macro), UMi (Urban Micro), RMa (Rural Macro) e Indoor.
Incluye modelos de path loss, shadow fading y fast fading.
**Para MATLAB:** Las fórmulas de path loss del Tabla 7.4.1-1 se pueden implementar
directamente como alternativa o complemento a Longley-Rice.
**Usar en TFG:** Sección 2.3 y validación en Sección 5.2.

---

### B3. Mediciones RSRP en campo para 5G FR1
**Título:** 5G NR Coverage and Signal Quality Measurements in Urban Environments
**Buscar en IEEE Xplore:** "RSRP measurement 5G NR FR1 field trial urban"
**Relevancia:** Proporciona valores reales de RSRP medidos en despliegues 5G FR1.
Imprescindible para validar los resultados de la simulación MATLAB en la Sección 5.2.
Buscar papers con mediciones en ciudades europeas (frecuencias similares).

---

## BLOQUE C — Redes 5G Tácticas / Burbujas Tácticas

### C1. Arquitectura de redes 5G privadas y tácticas
**Título:** Private 5G Networks: Concepts, Architectures, and Research Challenges
**Autores:** Ahokangas et al. (2021) / buscar también Ericsson y Nokia white papers
**Buscar en:** IEEE Access — "private 5G network architecture tactical deployment"
**Relevancia:** Define qué es una burbuja táctica 5G (celda privada temporal),
arquitecturas NSA/SA, casos de uso en emergencias y operaciones militares.
**Usar en TFG:** Sección 2.2 (Burbujas Tácticas 5G).

---

### C2. Planificación de cobertura para despliegues rápidos
**Título:** Rapid Deployment of 5G Networks for Emergency and Tactical Operations
**Buscar en:** IEEE Communications Magazine / Military Communications Conference (MILCOM)
**Keywords:** "deployable 5G", "rapid deployment cellular", "tactical LTE 5G coverage"
**Relevancia:** Describe los requisitos específicos de cobertura para redes tácticas:
tiempo de despliegue, movilidad, resiliencia, bandas de frecuencia usadas.
**Usar en TFG:** Sección 2.2 y justificación del Capítulo 1 (Motivación).

---

## BLOQUE D — Gemelo Digital en Telecomunicaciones

### D1. Survey fundacional sobre Digital Twins
**Título:** Digital Twin: Enabling Technologies, Challenges and Open Research
**Autores:** Fuller, A.; Fan, Z.; Day, C.; Barlow, C.
**Publicación:** IEEE Access, vol. 8, pp. 108952–108971, 2020
**DOI:** 10.1109/ACCESS.2020.2998358
**Acceso:** https://ieeexplore.ieee.org/document/9103025
**Relevancia DIRECTA:** Define el concepto de Digital Twin, taxonomía (descriptivo,
predictivo, prescriptivo) y aplicaciones en industria. Cita directa para la
definición en la Sección 2.5 del TFG.
**Usar en TFG:** Sección 2.5 (Conceptos de Gemelo Digital) — cita principal.

---

### D2. Gemelo Digital para redes móviles
**Título:** Digital Twin for 5G and Beyond Networks: Concepts, Architecture, and Use Cases
**Buscar en:** IEEE Network / IEEE Communications Magazine (2021-2024)
**Keywords:** "digital twin 5G network optimization", "network digital twin"
**Relevancia:** Específicamente sobre gemelos digitales de red para 5G.
Describe casos de uso en optimización SON, predicción de fallos, planificación.
**Usar en TFG:** Sección 2.5 — aplicaciones en telecom del concepto de DT.

---

### D3. Gemelo Digital para planificación radioeléctrica
**Título:** Radio Environment Map and Digital Twin for Spectrum Management
**Buscar en:** IEEE Transactions on Wireless Communications / IEEE Xplore
**Keywords:** "radio digital twin coverage", "network planning digital twin simulation"
**Relevancia:** Une los conceptos de DT con la planificación de cobertura RF.
El más relacionado con el enfoque del TFG (DT web para visualización de cobertura).
**Usar en TFG:** Sección 2.5 y 2.6 (Trabajos Relacionados) — diferenciación del TFG.

---

## BLOQUE E — Herramientas de Planificación Radioeléctrica (Comparativa)

### E1. SPLAT! — Herramienta open-source Longley-Rice
**Autor:** John A. Magliacane (KD2BD)
**Web:** https://www.qsl.net/kd2bd/splat.html
**Repositorio:** https://github.com/kd2bd/splat
**Relevancia:** Principal herramienta open-source basada en Longley-Rice.
Interfaz de línea de comandos Linux. Referencia para comparar con nuestra herramienta.
**Para MATLAB:** Su implementación de ITM puede servir como referencia para portar el
modelo a MATLAB.

---

### E2. CloudRF — Herramienta web freemium
**Web:** https://cloudrf.com
**API docs:** https://docs.cloudrf.com
**Modelo de propagación:** Longley-Rice + SRTM
**Relevancia:** Herramienta web más cercana a lo que implementamos. Freemium con
límite de créditos. Útil para comparar resultados con nuestra simulación.
**Usar en TFG:** Sección 2.4 (Herramientas existentes) + Sección 5.4 (Comparativa).

---

### E3. Xirio Online — Herramienta comercial de referencia
**Web:** https://www.xirio-online.com
**Operador:** Colegio Oficial de Ingenieros de Telecomunicación (España)
**Modelo:** Ray-tracing 3D + bases de datos edificios
**Precio:** ~5.000 €/año (licencia profesional)
**Relevancia:** Principal herramienta de referencia en España para planificación RF.
La tabla comparativa de la Sección 5.4 del TFG confrontará nuestra herramienta con Xirio.

---

## BLOQUE F — Datos de Elevación SRTM

### F1. SRTM 1 Arc-Second Global Dataset
**Organización:** NASA / USGS
**Resolución:** ~30 metros (1 arc-second)
**Acceso:** https://earthexplorer.usgs.gov/
**DOI:** 10.5066/F7PR7TFT
**Cómo descargar para Fuenlabrada:**
  1. Ir a earthexplorer.usgs.gov
  2. Buscar coordenadas: 40.2897°N, 3.8244°W
  3. Digital Elevation → SRTM → SRTM 1 Arc-Second Global
  4. Descargar tile: **N40W004** (cubre latitudes 40-41°N, longitudes 3-4°W)
  5. Guardar como: `matlab/data/N40W004.hgt` o `.tif`
  6. Abrir en MATLAB con: `[Z, R] = readgeoraster('N40W004.tif')`

---

## BLOQUE G — Papers para Búsqueda en IEEE Xplore (Keywords)

Lista de búsquedas recomendadas para encontrar papers adicionales:

```
1. "5G NR coverage simulation Longley-Rice" (IEEE Xplore)
2. "RSRP prediction machine learning 5G" (Google Scholar)
3. "digital twin radio frequency planning" (IEEE Access)
4. "tactical 5G network deployment emergency" (IEEE Communications Magazine)
5. "ITM irregular terrain model validation measurements" (IEEE T-AP)
6. "SRTM elevation data propagation model accuracy" (RadioScience)
7. "5G FR1 path loss measurement 3.5 GHz urban" (IEEE VTC)
8. "open-source RF planning tool comparison" (IEEE/Google Scholar)
9. "Angular Leaflet heatmap GIS visualization" (buscar en Medium/GitHub)
10. "Spring Boot REST API geospatial JSON" (documentación técnica)
```

---

## RESUMEN: Papers PRIORITARIOS para citar en el TFG

| # | Paper | Sección TFG | Estado |
|---|---|---|---|
| 1 | 3GPP TS 38.104 | 2.1, Bloque 5 MATLAB | Descargado (pdf) |
| 2 | 3GPP TR 38.901 | 2.3 | Descargado (pdf) |
| 3 | Fuller et al. (2020) — DT Survey | 2.5 | DOI confirmado |
| 4 | Longley & Rice (1968) | 2.3 | PDF disponible online |
| 5 | ITU-R P.1546-6 | 2.3 | Disponible en itu.int |
| 6 | SPLAT! / CloudRF comparison | 2.4 | Buscar en IEEE |
| 7 | RSRP field measurements 5G FR1 | 5.2 | Buscar en IEEE |
| 8 | Tactical 5G deployment | 2.2 | Buscar en IEEE/MILCOM |
