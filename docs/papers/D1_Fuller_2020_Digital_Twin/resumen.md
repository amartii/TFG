# Digital Twin: Enabling Technologies, Challenges and Open Research

## Datos bibliográficos
- **Autores:** Fuller, Aidan; Fan, Zhong; Day, Charles; Barlow, Chris
- **Año:** 2020
- **Publicación:** IEEE Access, vol. 8, pp. 108952–108971
- **DOI:** 10.1109/ACCESS.2020.2998358
- **URL:** https://ieeexplore.ieee.org/document/9103025
- **Acceso:** Open Access (IEEE Access es de acceso libre)

## Relevancia para el TFG
Este paper es la referencia principal del TFG para el concepto de Digital Twin (gemelo digital). Proporciona una definición consensuada y una taxonomía rigurosa del Digital Twin que debe usarse en la Sección 2.5 de la memoria. La definición de los autores — "integración sin fricción de datos entre una máquina física y su representación virtual en ambas direcciones" — captura exactamente la esencia del sistema desarrollado en el TFG: el script MATLAB crea una representación virtual del entorno radioeléctrico real, actualizable con nuevos datos.

La taxonomía descriptivo/predictivo/prescriptivo es especialmente útil para clasificar el sistema del TFG. El mapa de cobertura estático sería un DT descriptivo; la predicción de cobertura en tiempo real con actualización de parámetros sería predictivo; un sistema que optimiza automáticamente la posición de la antena para maximizar cobertura sería prescriptivo. Esta jerarquía ayuda a situar el alcance del TFG y a identificar líneas de trabajo futuro.

El paper también revisa las tecnologías habilitadoras del DT (IoT, IA/ML, computación en la nube, simulación física) y los desafíos abiertos (latencia, fidelidad del modelo, ciberseguridad), lo que proporciona contexto para justificar las elecciones de implementación del TFG y para la sección de trabajo futuro.

## Conceptos clave
- **Digital Twin (DT):** Representación virtual de un sistema físico, sincronizada bidireccionalmentecon su contraparte real mediante datos en tiempo real
- **Taxonomía DT:** Descriptivo (replica el estado actual), Predictivo (anticipa comportamientos futuros), Prescriptivo (recomienda acciones de optimización)
- **Digital Shadow:** Variante unidireccional del DT; flujo de datos solo del objeto físico al virtual (sin retroalimentación)
- **Tecnologías habilitadoras:** IoT (sensores), Cloud Computing, IA/ML, simulación física, gemelos de proceso
- **Fidelidad del modelo:** Grado de correspondencia entre el modelo virtual y la realidad; trade-off entre precisión y costo computacional
- **Ciclo de vida DT:** El DT puede existir antes del objeto físico (diseño), durante su operación (monitorización), y después (análisis post-mortem)
- **Aplicaciones revisadas:** Manufactura, salud, smart cities, aeroespacial, energía
- **Desafíos abiertos:** Interoperabilidad, estandarización, latencia de sincronización, privacidad de datos

## Cómo usar en la memoria
- **Sección:** 2.5 — Digital Twin: definición y taxonomía (cita principal)
- **Propósito:** Usar la definición y taxonomía de Fuller et al. como marco conceptual. Clasificar el sistema del TFG según la taxonomía (descriptivo/predictivo). Usar los desafíos identificados para justificar decisiones de diseño y proponer trabajo futuro.

## Estado de descarga

**PDF descargado correctamente** — `Fuller_2020_Digital_Twin.pdf` (845 KB)

Fuente utilizada: arXiv preprint (idéntico al publicado en IEEE Access con CC BY 4.0)
- **arXiv:** https://arxiv.org/abs/1911.01276
- **PDF directo:** https://arxiv.org/pdf/1911.01276

## Notas de lectura
> PDF descargado. Leer especialmente:
> - Sección II: Definition and Classification of Digital Twins
> - Sección III: Enabling Technologies
> - Sección VII: Challenges and Open Research
>
> Citar como: "Fuller et al. [X] definen el Digital Twin como..."

## Cita BibTeX
```bibtex
@article{Fuller2020DigitalTwin,
  author  = {Fuller, Aidan and Fan, Zhong and Day, Charles and Barlow, Chris},
  title   = {Digital Twin: Enabling Technologies, Challenges and Open Research},
  journal = {IEEE Access},
  year    = {2020},
  volume  = {8},
  pages   = {108952--108971},
  doi     = {10.1109/ACCESS.2020.2998358},
  url     = {https://ieeexplore.ieee.org/document/9103025},
  note    = {Open access. Cita principal para la definición y taxonomía de Digital Twin en el TFG.}
}
```
