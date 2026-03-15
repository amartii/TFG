# Study on Channel Model for Frequencies from 0.5 to 100 GHz (3GPP TR 38.901)

## Datos bibliográficos
- **Autores/Organización:** 3GPP (3rd Generation Partnership Project)
- **Año:** Versión 17.x (2022–2023); versión más reciente en archivo: 38901-j20.zip (enero 2026)
- **Publicación:** 3GPP Technical Report TR 38.901
- **DOI/URL:** https://www.3gpp.org/ftp/Specs/archive/38_series/38.901/
- **Versión recomendada para el TFG:** TR 38.901 v17.x (Release 17)

## Relevancia para el TFG
Este Technical Report es la referencia normativa 3GPP para modelos de canal en el rango de frecuencias de 0.5 a 100 GHz. Define los modelos de path loss para todos los escenarios de despliegue 5G NR: UMa (Urban Macrocell), UMi (Urban Microcell), RMa (Rural Macrocell) e InH (Indoor Hotspot). La Tabla 7.4.1-1 de este documento define las fórmulas de pérdida de trayectoria que son la referencia para comparar con los resultados del modelo ITM del TFG.

Para la Sección 2.3, el TR 38.901 proporciona las fórmulas detalladas de path loss con sus condiciones de validez (rango de distancias, alturas de antena, frecuencias). El escenario UMa es el más relevante para el TFG dado que modela estaciones base en altura con cobertura macrocelular — el caso típico de un despliegue táctico con mástil elevado.

Para la Sección 5.2, los parámetros estadísticos del canal (Large Scale Parameters: delay spread, angular spread, shadow fading) definidos en el TR 38.901 permiten estimar la variabilidad esperada de las predicciones de cobertura y generar realizaciones estadísticamente consistentes del canal para simulación de Monte Carlo.

## Conceptos clave
- **UMa (Urban Macrocell):** Escenario con BS a 25 m de altura, distancias 10–5000 m; el más relevante para el TFG
- **UMi (Urban Microcell — Street Canyon):** BS a 10 m, distancias cortas; para microceldas tácticas
- **RMa (Rural Macrocell):** BS a 35 m, distancias hasta 10 km; relevante para terreno abierto
- **Path loss UMa LoS:** PL = 28.0 + 22·log₁₀(d₃D) + 20·log₁₀(f_c) [dB], válido para 10 m ≤ d₂D ≤ d'BP
- **Path loss UMa NLoS:** PL = 13.54 + 39.08·log₁₀(d₃D) + 20·log₁₀(f_c) – 0.6·(h_UT–1.5) [dB]
- **Large Scale Parameters (LSP):** DS (delay spread), ASA/ASD (angular spreads), SF (shadow fading), K (Ricean factor)
- **Breakpoint distance d'BP:** Distancia de ruptura de la pendiente dual-slope en LoS
- **Blockage model:** Modelo de obstrucción por personas y vehículos
- **Fast fading:** Modelos de canal MIMO con trazado de rayos estocástico (GBSM: Geometry-Based Stochastic Model)

## Cómo usar en la memoria
- **Sección:** 2.3 — Comparación del modelo ITM con modelos 3GPP para 5G NR
- **Sección:** 5.2 — Validación de resultados y análisis estadístico
- **Propósito:** Usar las fórmulas de la Tabla 7.4.1-1 como referencia para comparar con las predicciones del motor ITM. Los parámetros de shadow fading (σ_SF) proporcionan la incertidumbre estadística de las predicciones.

## Estado de descarga

**Archivo descargado correctamente** — `3GPP_TR_38901.zip` (3.1 MB)

El zip contiene: `38901-j20.docx` (documento Word, versión j20 = Release 19, enero 2026).
Descargar desde: https://www.3gpp.org/ftp/Specs/archive/38_series/38.901/38901-j20.zip

## Notas de lectura
> ZIP descargado. Extraer el .docx y abrir con Word/LibreOffice.
> Secciones clave a leer:
> - Sección 7.4.1: Path loss models (Tabla 7.4.1-1 imprescindible)
> - Sección 7.3: Scenarios and deployment configurations
> - Sección 7.5: Fast fading model parameters
> Extraer las fórmulas de UMa LoS y NLoS para incluir en la memoria.

## Cita BibTeX
```bibtex
@techreport{3GPP_TR38901,
  author      = {{3GPP}},
  title       = {Study on Channel Model for Frequencies from 0.5 to 100 {GHz}},
  institution = {3rd Generation Partnership Project (3GPP)},
  year        = {2022},
  number      = {TR 38.901 v17.0.0},
  type        = {Technical Report},
  url         = {https://www.3gpp.org/ftp/Specs/archive/38_series/38.901/},
  note        = {Defines path loss models and channel parameters for 5G NR scenarios (UMa, UMi, RMa)}
}
```
