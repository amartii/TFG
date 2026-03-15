# Prediction of Tropospheric Radio Transmission Loss over Irregular Terrain

## Datos bibliográficos
- **Autores:** Longley, A.G.; Rice, P.L.
- **Año:** 1968
- **Publicación:** ESSA Technical Report ERL 79-ITS 67, U.S. Department of Commerce, Institute for Telecommunication Sciences (ITS), Boulder, Colorado
- **DOI/URL:** https://www.its.bldrdoc.gov/media/50676/TRlong-rice.pdf

## Relevancia para el TFG
Este informe técnico es el documento fundacional del modelo Longley-Rice (también conocido como Irregular Terrain Model, ITM). Define las bases matemáticas completas del modelo de propagación que se utiliza como motor de cálculo en el script MATLAB del TFG para estimar la pérdida de trayectoria en entornos irregulares.

El modelo combina teoría electromagnética con datos empíricos recopilados en campañas de medición reales. Incorpora tres mecanismos de propagación: línea de visión directa (LoS), difracción sobre obstáculos del terreno (knife-edge y smooth Earth), y dispersión troposférica para distancias largas. Esta formulación multi-mecanismo es la razón por la que el ITM supera a modelos empíricos simples como Okumura-Hata en escenarios con orografía compleja.

Para el TFG, es la referencia obligatoria al describir el modelo matemático que sustenta la predicción de cobertura. Toda explicación de cómo se calculan las pérdidas de propagación en el motor MATLAB debe citar este paper, ya que es el origen de las ecuaciones implementadas.

## Conceptos clave
- **Modelo Longley-Rice / ITM:** Modelo semi-empírico de propagación para terreno irregular, válido de 20 MHz a 20 GHz y para distancias de 1 a 2000 km
- **Tres mecanismos de propagación:** Line-of-Sight (LoS), difracción (sobre obstáculos y curvatura terrestre), y troposcat (dispersión troposférica)
- **Perfil de terreno (PFL):** El modelo requiere un perfil de elevación del terreno entre transmisor y receptor como entrada principal
- **Parámetros de variabilidad:** El modelo trabaja con percentiles de tiempo, localización y situación para caracterizar la variabilidad estadística de la señal
- **Irregularidad del terreno (Δh):** Parámetro clave que resume la rugosidad del terreno en la trayectoria
- **Pérdida básica de transmisión (L_b):** Salida principal del modelo, en dB, equivalente a la atenuación total entre antenas isotrópicas en espacio libre más las pérdidas por el terreno
- **Refractividad superficial (N_0):** Parámetro atmosférico que afecta la propagación, especialmente en trayectorias largas
- **Polarización:** El modelo distingue entre propagación horizontal y vertical

## Cómo usar en la memoria
- **Sección:** 2.3 — Modelo de propagación
- **Propósito:** Citar como referencia primaria del modelo ITM. Al describir las ecuaciones de pérdida de trayectoria utilizadas en el motor MATLAB, este es el paper que las origina. Usar también para justificar la elección del modelo frente a alternativas más simples.

## Notas de lectura
> TODO: Leer el Capítulo 3 (Mathematical Model) y el Capítulo 4 (Empirical Validation).
> Anotar las ecuaciones de pérdida para cada modo de propagación.
> Comparar con la implementación C++ de NTIA (A2) para verificar equivalencia.

**Estado:** `Longley_Rice_1968.pdf` descargado correctamente (4.2 MB) desde DTIC — Defense Technical Information Center (https://apps.dtic.mil/sti/pdfs/AD0676874.pdf). Dominio público (U.S. Government work).

## Cita BibTeX
```bibtex
@techreport{Longley1968,
  author      = {Longley, Anita G. and Rice, Philip L.},
  title       = {Prediction of Tropospheric Radio Transmission Loss over Irregular Terrain: A Computer Method},
  institution = {Environmental Science Services Administration, Institute for Telecommunication Sciences},
  year        = {1968},
  number      = {ESSA Technical Report ERL 79-ITS 67},
  address     = {Boulder, Colorado},
  url         = {https://www.its.bldrdoc.gov/media/50676/TRlong-rice.pdf},
  note        = {Foundational document of the Longley-Rice / Irregular Terrain Model (ITM)}
}
```
