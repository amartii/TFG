# NR; Base Station (BS) Radio Transmission and Reception (3GPP TS 38.104)

## Datos bibliográficos
- **Autores/Organización:** 3GPP (3rd Generation Partnership Project)
- **Año:** Versión 17.x (2022–2023); versión más reciente en archivo: 38104-j30.zip (enero 2026)
- **Publicación:** 3GPP Technical Specification TS 38.104
- **DOI/URL:** https://www.3gpp.org/ftp/Specs/archive/38_series/38.104/
- **Versión recomendada para el TFG:** TS 38.104 v17.x (Release 17) o v18.x (Release 18)

## Relevancia para el TFG
Esta especificación técnica es la referencia normativa para los parámetros de la estación base 5G NR (gNB). Define las bandas de frecuencia NR para FR1 (Frequency Range 1: 450 MHz–7125 MHz), incluyendo la banda n78 (3.4–3.8 GHz) que es la utilizada en el TFG. Sin este documento, no es posible justificar técnicamente los parámetros de configuración de la estación base simulada.

El parámetro crítico para el cálculo de RSRP en el script MATLAB es el número de Resource Blocks (NRB). La especificación define NRB=66 para un canal de 100 MHz con espaciado de subportadora (SCS) de 30 kHz en la banda n78. Este valor se usa directamente en la fórmula de conversión entre potencia por subportadora y potencia total de la estación base, lo que afecta directamente a los niveles de RSRP calculados en el mapa de cobertura.

Además, la especificación define los niveles de potencia máxima de transmisión, las configuraciones de antena, y los requisitos de sensibilidad del receptor — todos parámetros necesarios para una simulación realista del enlace descendente 5G NR.

## Conceptos clave
- **FR1 (Frequency Range 1):** 450 MHz – 7125 MHz; incluye las bandas 5G sub-6 GHz
- **Banda n78:** 3.4–3.8 GHz (DL y UL en TDD); banda principal 5G en Europa y Asia
- **NRB (Number of Resource Blocks):** 66 bloques de recursos para BW=100 MHz, SCS=30 kHz en n78
- **SCS (Subcarrier Spacing):** 30 kHz para FR1 con canales de 60/80/100 MHz; define la granularidad espectral
- **EIRP (Effective Isotropic Radiated Power):** Potencia máxima radiada; límite regulatorio y parámetro de enlace
- **TRP (Total Radiated Power):** Potencia total radiada medida en esfera; parámetro de caracterización de antena
- **Channel Bandwidth (BW):** Anchura de banda del canal; opciones para n78: 10/15/20/25/30/40/50/60/70/80/90/100 MHz
- **RSRP (Reference Signal Received Power):** Potencia media recibida en las subportadoras de referencia (RE); se calcula por subportadora y luego se promedia sobre NRB

## Cómo usar en la memoria
- **Sección:** 2.1 — Parámetros del sistema 5G NR y parámetros del script MATLAB
- **Propósito:** Justificar los valores de NRB=66, SCS=30 kHz, BW=100 MHz y banda n78 usados en los cálculos de RSRP. Es la referencia normativa que valida los parámetros de configuración de la gNB simulada.

## Estado de descarga

**Archivo descargado correctamente** — `3GPP_TS_38104.zip` (3.8 MB)

El zip contiene: `38104-j30.docx` (documento Word, versión j30 = Release 19, enero 2026).
Descargar desde: https://www.3gpp.org/ftp/Specs/archive/38_series/38.104/38104-j30.zip

## Notas de lectura
> ZIP descargado. Extraer el .docx y abrir con Word/LibreOffice.
> Revisar la Tabla 5.3.2-1 (NR operating bands for FR1) y las Tablas de NRB.
> Anotar la Tabla con NRB para todas las combinaciones de BW y SCS.

## Cita BibTeX
```bibtex
@techreport{3GPP_TS38104,
  author      = {{3GPP}},
  title       = {{NR}; Base Station ({BS}) Radio Transmission and Reception},
  institution = {3rd Generation Partnership Project (3GPP)},
  year        = {2022},
  number      = {TS 38.104 v17.6.0},
  type        = {Technical Specification},
  url         = {https://www.3gpp.org/ftp/Specs/archive/38_series/38.104/},
  note        = {Defines NR operating bands, channel bandwidths, and NRB configurations for FR1}
}
```
