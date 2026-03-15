# 3.5 GHz Coverage Assessment with a 5G Testbed

## Datos bibliográficos
- **Autores:** Schumacher, Adrian; Merz, Ruben; Burg, Andreas
- **Año:** 2021 (presentado en VTC2019-Spring; versión arXiv de 2021)
- **Publicación:** IEEE Vehicular Technology Conference (VTC Spring)
- **arXiv:** https://arxiv.org/abs/2105.06812
- **PDF directo:** https://arxiv.org/pdf/2105.06812

## Estado de descarga

**PDF descargado correctamente** — `Path_Loss_5G_FR1.pdf` (3.4 MB)

Fuente: arXiv preprint 2105.06812

## Cambio respecto al placeholder original
El placeholder buscaba un paper genérico de path loss 5G NR en 3.5 GHz. Se encontró este paper de mediciones reales con prototipo 5G en 3.5 GHz en entornos rural, suburbano y urbano, que es directamente relevante para validar los modelos de propagación del TFG en FR1.

## Relevancia para el TFG
Este paper proporciona mediciones empíricas de pérdida de trayectoria (path loss) en la banda de 3.5 GHz (banda n78, FR1) en entornos urbanos de tipo macrocelda, que es exactamente el escenario de despliegue contemplado en el TFG. Compara modelos teóricos estándar — COST-231 Hata, Okumura-Hata y los modelos 3GPP TR 38.901 (UMa, UMi) — con datos reales de medición.

La importancia para el TFG es que permite validar si el modelo Longley-Rice produce resultados comparables a los obtenidos con modelos específicamente diseñados para 5G NR en FR1, y cuantificar el error esperado del modelo ITM en este rango de frecuencias. Es especialmente relevante la comparación con el modelo UMa (Urban Macrocell) de TR 38.901, que es el escenario de referencia para redes 5G tácticas.

Además, las mediciones de este tipo de papers suelen incluir estadísticas de error (RMSE, desviación estándar del shadow fading) que son necesarias para caracterizar la incertidumbre de los mapas de cobertura generados por el TFG.

## Conceptos clave
- **Path loss exponent:** Exponente de pérdida de trayectoria, normalmente entre 2 (espacio libre) y 4 (urbano denso) para 3.5 GHz
- **Shadow fading:** Variación aleatoria log-normal de la señal debida a obstaculización; desviación típica σ entre 4-10 dB para UMa
- **Modelo COST-231 Hata:** Extensión de Okumura-Hata para frecuencias 1500-2000 MHz; limitado para 3.5 GHz
- **Modelo 3GPP TR 38.901 UMa:** Path loss = 28.0 + 22log₁₀(d₃D) + 20log₁₀(fc) para LoS; fórmula extendida para NLoS
- **Banda n78 (3.4–3.8 GHz):** Banda FR1 principal para 5G NR en Europa; objeto de estudio de este tipo de papers
- **Breakpoint distance:** Distancia crítica a partir de la cual cambia la pendiente del path loss en el modelo dual-slope
- **Drive test / measurement campaign:** Metodología de medición con vehículo equipado con UE 5G real

## Resumen del paper

Schumacher et al. presentan una campaña de medición con un prototipo 5G NR operando a 3.5 GHz (banda 3.4–3.8 GHz, n78) en tres entornos: rural, suburbano y urbano. Evalúan modelos de path loss para escenarios outdoor e indoor, proporcionando datos empíricos críticos para la planificación de redes 5G en FR1. El estudio llena un vacío de datos empíricos para esta banda de frecuencias.

## Cómo usar en la memoria
- **Sección:** 2.3 — Modelos de propagación y validación
- **Propósito:** Comparar el modelo ITM del TFG con mediciones reales a 3.5 GHz en los mismos tipos de entorno. Usar las cifras de path loss exponent como referencia para la discusión de precisión del sistema.

## Notas de lectura
> PDF descargado desde arXiv (2105.06812).
> Leer las secciones de resultados de path loss outdoor para entornos rural y urbano.
> Anotar los path loss exponents medidos y compararlos con el modelo ITM.

## Cita BibTeX
```bibtex
@inproceedings{Schumacher2021_5G_3p5GHz,
  author    = {Schumacher, Adrian and Merz, Ruben and Burg, Andreas},
  title     = {3.5 {GHz} Coverage Assessment with a 5{G} Testbed},
  booktitle = {IEEE Vehicular Technology Conference (VTC Spring)},
  year      = {2021},
  url       = {https://arxiv.org/abs/2105.06812},
  note      = {arXiv:2105.06812. Mediciones empíricas de cobertura 5G NR a 3.5 GHz en entornos rural, suburbano y urbano.}
}
```
