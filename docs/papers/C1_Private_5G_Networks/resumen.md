# Private 5G: The Future of Industrial Wireless

## Datos bibliográficos
- **Autor:** Aijaz, Adnan
- **Año:** 2020
- **Publicación:** IEEE Wireless Communications (o arXiv preprint)
- **arXiv:** https://arxiv.org/abs/2006.01820
- **PDF directo:** https://arxiv.org/pdf/2006.01820

## Estado de descarga

**PDF descargado correctamente** — `Private_5G_Networks.pdf` (470 KB)

Fuente: arXiv preprint 2006.01820

## Cambio respecto al placeholder original
El placeholder buscaba un paper sobre arquitecturas de redes 5G privadas. Se encontró este artículo de Adnan Aijaz (Nokia Bell Labs) que proporciona una visión general de las redes 5G privadas para uso industrial: arquitectura, opciones de espectro, consideraciones de implementación y obstáculos.

## Relevancia para el TFG
Las redes 5G privadas son el marco conceptual del TFG. El concepto de "burbuja táctica 5G" — una red autónoma y desplegable que provee conectividad 5G en un área operacional sin depender de infraestructura fija — se enmarca directamente en la literatura de private 5G networks. Este paper define la taxonomía, las arquitecturas posibles y los casos de uso, proporcionando el vocabulario técnico que debe usar la Sección 2.2 de la memoria.

Las arquitecturas Non-Standalone (NSA) y Standalone (SA) definidas en este contexto son relevantes porque determinan los requisitos de infraestructura del despliegue táctico: NSA requiere ancla LTE (más rápido de desplegar, menos autónomo), mientras que SA es completamente independiente (más complejo pero idóneo para uso táctico sin infraestructura civil). El TFG debe posicionarse respecto a esta elección arquitectural.

Los casos de uso en emergencias y seguridad pública identificados en este tipo de papers son directamente aplicables al TFG: cobertura temporal en desastres naturales, operaciones de búsqueda y rescate, comunicaciones tácticas militares. Estos casos de uso justifican el desarrollo del TFG y deben mencionarse en la introducción.

## Conceptos clave
- **Red 5G privada (Non-Public Network, NPN):** Red 5G NR operada por una organización para uso propio, con espectro dedicado o compartido
- **Standalone NPN (SNPN):** Red 5G completamente independiente, sin roaming con PLMN pública; máxima autonomía táctica
- **Public Network Integrated NPN (PNI-NPN):** Red privada integrada en red pública mediante Network Slicing
- **Network Slicing:** Virtualización de la red para crear instancias lógicas independientes (slices) sobre infraestructura física compartida
- **Arquitectura NSA (Non-Standalone):** gNB 5G NR con ancla en core LTE (EPC); banda n78 para datos, LTE para control
- **Arquitectura SA (Standalone):** gNB 5G NR con 5GC (5G Core) completo; máxima autonomía y capacidades 5G nativas
- **Burbuja táctica 5G:** Red autónoma y transportable que provee cobertura 5G en un área operacional definida
- **Casos de uso PPDR (Public Protection and Disaster Relief):** Comunicaciones de emergencia, first responders, seguridad pública

## Cómo usar en la memoria
- **Sección:** 2.2 — Redes 5G privadas y despliegue táctico
- **Propósito:** Definir el concepto de burbuja táctica, describir las arquitecturas NSA/SA, y justificar el caso de uso del TFG. Usar la taxonomía de este paper para clasificar el sistema desarrollado.

## Resumen del paper

Aijaz examina cómo las redes 5G privadas pueden modernizar entornos industriales (Industry 4.0). Proporciona una visión general de los sistemas 5G privados: arquitectura, ventajas, opciones de espectro (licenciado, compartido, no licenciado), consideraciones de implementación y obstáculos. También aborda la estandarización 3GPP de Non-Public Networks (NPN) y marcos de innovación colaborativa.

## Notas de lectura
> PDF descargado. Leer las secciones de arquitectura NPN y opciones de espectro.
> Buscar discusión sobre Standalone NPN (SNPN) vs PNI-NPN.
> Anotar los casos de uso industriales relevantes para el TFG.

## Cita BibTeX
```bibtex
@article{Aijaz2020_Private5G,
  author  = {Aijaz, Adnan},
  title   = {Private 5{G}: The Future of Industrial Wireless},
  journal = {IEEE Wireless Communications},
  year    = {2020},
  url     = {https://arxiv.org/abs/2006.01820},
  note    = {arXiv:2006.01820. Visión general de redes 5G privadas para uso industrial: arquitectura NPN, espectro y casos de uso.}
}
```
