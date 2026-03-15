# 5G Coverage, Prediction, and Trial Measurements

## Datos bibliográficos
- **Autores:** Curry, Tristan; Abbas, Robert
- **Año:** 2020
- **Publicación:** arXiv preprint
- **arXiv:** https://arxiv.org/abs/2003.09574
- **PDF directo:** https://arxiv.org/pdf/2003.09574

## Estado de descarga

**PDF descargado correctamente** — `RSRP_Measurements_5G.pdf` (744 KB)

Fuente: arXiv preprint 2003.09574 (descargado via WebFetch)

## Cambio respecto al placeholder original
El placeholder buscaba mediciones de RSRP en redes 5G NR FR1 en entornos urbanos. Se encontró este paper de Curry & Abbas (2020) que presenta presupuesto de enlace 5G en la banda n78 (3.3–3.8 GHz, Australia), predicciones de cobertura con software Atoll, y mediciones de un trial 5G NR NSA a 3.5 GHz con 60 MHz de ancho de banda. Incluye comparación entre predicción y medición real — exactamente lo que se necesita para validar el sistema del TFG.

## Relevancia para el TFG
Las mediciones reales de RSRP en redes 5G NR FR1 son imprescindibles para validar los resultados del TFG. El mapa de cobertura generado por el motor MATLAB produce predicciones de RSRP en dBm; sin datos de referencia de campo, no es posible verificar si esas predicciones son razonables ni cuantificar el error del sistema.

Los papers de medición de campo (drive test / field trial) reportan valores típicos de RSRP en entornos urbanos con 5G NR a 3.5 GHz. Los rangos habituales son: excelente cobertura RSRP > −80 dBm, buena cobertura −80 a −100 dBm, cobertura marginal −100 a −110 dBm, sin servicio < −110 dBm. Estos umbrales son los que debe usar el TFG para clasificar las zonas del mapa de cobertura.

Además, estos papers suelen incluir correlación entre RSRP y otras métricas de calidad (SINR, RSRQ, throughput), lo que permite enriquecer el análisis del TFG más allá de la simple predicción de nivel de señal.

## Conceptos clave
- **RSRP (Reference Signal Received Power):** Potencia media por subportadora de referencia (RE); medida en dBm; rango típico en 5G: −44 a −140 dBm
- **RSRQ (Reference Signal Received Quality):** Relación RSRP/RSSI; indica calidad relativa de la señal
- **SINR (Signal to Interference plus Noise Ratio):** Relación señal a interferencia+ruido; predictor del throughput
- **Drive test:** Campaña de medición con vehículo equipado con UE 5G NR comercial y GPS; estándar de facto para validación de cobertura
- **Umbrales 5G NR (3GPP):** RSRP > −80 dBm (excelente), −80 a −100 (buena), −100 a −110 (marginal), < −110 (sin servicio)
- **Correlation length:** Distancia espacial sobre la que se correlaciona el shadow fading; típicamente 15–50 m en urbano
- **Penetration loss:** Pérdida por penetración en edificios; 15–25 dB para muros exteriores en 3.5 GHz
- **Handover margin:** Margen de RSRP para decidir traspaso entre celdas; típicamente 3–6 dB

## Cómo usar en la memoria
- **Sección:** 3.x ó 5.x — Validación de resultados del mapa de cobertura
- **Propósito:** Usar los valores de RSRP medidos como referencia de validación. Comparar las predicciones del TFG con rangos reportados en literatura para el mismo tipo de escenario.

## Resumen del paper

Curry & Abbas presentan un estudio completo de planificación de cobertura 5G NR en la banda n78 (3.3–3.8 GHz) para el mercado australiano. Incluye: (1) presupuesto de enlace para servicios de datos, (2) predicción de cobertura con software RF (Atoll), y (3) mediciones de campo de un trial 5G NR NSA a 3.5 GHz con 60 MHz de BW. El paper compara predicciones teóricas con mediciones reales, proporcionando validación empírica del modelo de planificación. Los valores de SS-RSRP medidos y los rangos de cobertura documentados son referencia directa para el TFG.

## Notas de lectura
> PDF descargado. Leer la sección de resultados de medición del trial 5G NR.
> Anotar los valores de RSRP medidos en función de la distancia a la BS.
> Usar los datos de cobertura para validar los rangos del mapa del TFG.

## Cita BibTeX
```bibtex
@misc{Curry2020_5G_Coverage,
  author    = {Curry, Tristan and Abbas, Robert},
  title     = {5{G} Coverage, Prediction, and Trial Measurements},
  year      = {2020},
  url       = {https://arxiv.org/abs/2003.09574},
  note      = {arXiv:2003.09574. Presupuesto de enlace, predicción y mediciones de trial 5G NR NSA a 3.5 GHz (banda n78).}
}
```
