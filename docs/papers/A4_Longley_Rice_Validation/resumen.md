# Evaluation of Prediction Accuracy for the Longley-Rice Model in the FM and TV Bands

## Datos bibliográficos
- **Autores:** Miles-Boarth, Timothy (y coautores de la Universidad de Huddersfield)
- **Año:** 2013
- **Publicación:** XI International Conference on Electronics, Telecommunications, Automatics and Informatics (ETAI 2013), septiembre 2013
- **URL de acceso libre:** https://eprints.hud.ac.uk/id/eprint/21830/1/T1-4.pdf
- **Repositorio:** University of Huddersfield Open Access Repository

## Estado de descarga

**PDF descargado correctamente** — `Longley_Rice_Validation.pdf` (855 KB)

Fuente: repositorio abierto de la Universidad de Huddersfield
URL directa: https://eprints.hud.ac.uk/id/eprint/21830/1/T1-4.pdf

## Cambio respecto al placeholder original
El placeholder buscaba un paper genérico de validación ITM en VHF/UHF. Se encontró este paper de evaluación de precisión del modelo Longley-Rice en bandas FM (VHF) y TV (UHF) mediante mediciones de campo con analizador de espectro portátil Rohde & Schwarz FSH3, publicado en acceso abierto.

## Relevancia para el TFG
Los estudios de validación del modelo Longley-Rice son esenciales para el TFG porque cuantifican el error medio esperado del modelo según el tipo de terreno, la frecuencia y la distancia. Esta información permite establecer las limitaciones del sistema desarrollado y proporcionar intervalos de confianza para los mapas de cobertura generados.

El modelo ITM fue diseñado originalmente para bandas VHF y UHF (30 MHz–3 GHz). Los estudios de validación muestran errores medios (RMSE) típicamente entre 6–12 dB en terreno irregular, con mejor comportamiento en terreno rural que en urbano. Para el TFG, que trabaja a 3.5 GHz (límite superior del rango validado), estas cifras de error son la referencia para calibrar la confianza en las predicciones.

Los trabajos de validación también identifican las condiciones de fallo del modelo: terreno montañoso con múltiples crestas, entornos urbanos densos (donde el clutter no modelado introduce errores sistemáticos), y situaciones de propagación anómala (ductos atmosféricos). Conocer estos límites es imprescindible para la sección de análisis de resultados del TFG.

## Conceptos clave
- **RMSE (Root Mean Square Error):** Métrica principal de validación; típicamente 6–12 dB para ITM en VHF/UHF
- **Bias (sesgo sistemático):** El ITM tiende a subestimar las pérdidas en entornos urbanos al no modelar el clutter de edificios
- **Tipos de terreno evaluados:** Llanura, costa, montaña, suburbano, rural; el error varía significativamente entre categorías
- **Bandas de validación:** VHF (30–300 MHz), UHF (300 MHz–3 GHz); extrapolación a 3.5 GHz introduce incertidumbre adicional
- **Comparación con medidas drive-test:** Metodología estándar de validación usando vehículos de medición con GPS
- **Factores de error identificados:** Clutter no modelado, resolución del DEM, efectos atmosféricos locales, múltiples difracciones
- **Irregularidad del terreno Δh:** Principal predictor de la precisión del modelo; mayor Δh → mayor incertidumbre

## Cómo usar en la memoria
- **Sección:** 2.3 — Precisión y limitaciones del modelo de propagación
- **Propósito:** Cuantificar el error esperado del motor ITM del TFG. Usar las cifras RMSE de validación para establecer los márgenes de incertidumbre de los mapas de cobertura.

## Resumen del paper

El paper evalúa la precisión del modelo Longley-Rice en bandas FM (88–108 MHz, VHF) y TV UHF (470–790 MHz) usando datos reales de emisoras griegas (ERT S.A.) en la región de Tesalónica. Las mediciones se realizaron con analizador Rohde & Schwarz FSH3 y antenas calibradas biconical y log-periodic. Resultado clave: el modelo sobreestima la intensidad de campo en VHF-FM más que en UHF-TV, con mejor precisión en este último.

## Notas de lectura
> PDF descargado. Leer la sección de resultados y errores de predicción.
> Anotar los valores de RMSE y bias para FM y TV por separado.
> Comparar con los errores esperados del ITM a 3.5 GHz (extrapolación necesaria).
> Complementar con: NTIA Report 82-100 (Hufford et al. 1982) disponible en:
> https://its.ntia.gov/publications/download/82-100_ocr.pdf

## Cita BibTeX
```bibtex
@inproceedings{MilesBoarth2013_LR_Validation,
  author    = {Miles-Boarth, Timothy and others},
  title     = {Evaluation of Prediction Accuracy for the {Longley-Rice} Model in the {FM} and {TV} Bands},
  booktitle = {XI International Conference on Electronics, Telecommunications, Automatics and Informatics (ETAI 2013)},
  year      = {2013},
  url       = {https://eprints.hud.ac.uk/id/eprint/21830/1/T1-4.pdf},
  note      = {Acceso libre, repositorio Universidad de Huddersfield. Validación ITM con mediciones de campo en VHF/UHF.}
}
```
