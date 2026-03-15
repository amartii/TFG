# Rapidly Deployable Intelligent 5G Aerial Neutral Host Networks: an O-RAN-Based Approach

## Datos bibliográficos
- **Autores:** Chu, Yi; Grace, David; Shackleton, Josh; White, Andy; Hunter, David; Ahmadi, Hamed
- **Año:** 2024
- **Publicación:** arXiv preprint / conferencia pendiente de publicación
- **arXiv:** https://arxiv.org/abs/2403.11869
- **PDF directo:** https://arxiv.org/pdf/2403.11869

## Estado de descarga

**PDF descargado correctamente** — `Tactical_5G_Deployment.pdf` (1.4 MB)

Fuente: arXiv preprint 2403.11869

## Cambio respecto al placeholder original
El placeholder buscaba un paper genérico de despliegue táctico 5G. Se encontró este paper sobre redes 5G aéreas neutrales de despliegue rápido basadas en O-RAN, que es altamente relevante para el TFG por combinar: (1) despliegue rápido, (2) arquitectura 5G moderna, (3) O-RAN para flexibilidad, y (4) nodos aéreos (UAV/HAPS) para cobertura rápida en áreas sin infraestructura.

## Relevancia para el TFG
Este tipo de paper define los requisitos operacionales y técnicos específicos de los despliegues 5G tácticos rápidos, que son el contexto de aplicación del TFG. Mientras que los papers de redes 5G privadas describen la arquitectura, los papers de despliegue táctico responden a preguntas operacionales: ¿cuánto tiempo tarda el despliegue? ¿qué equipamiento se necesita? ¿cómo se asegura la resiliencia? ¿qué cobertura mínima es aceptable?

Los requisitos de cobertura para redes tácticas son más exigentes que los de redes comerciales en algunos aspectos (disponibilidad, latencia de misión crítica) y menos exigentes en otros (densidad de usuarios, throughput pico). Entender esta diferencia es crucial para justificar las decisiones de diseño del TFG, especialmente los umbrales de RSRP considerados aceptables.

La movilidad del sistema (deployable on a vehicle, manpack, etc.) y el tiempo de despliegue (objetivo < 30 minutos para sistemas tácticos) son parámetros que deben mencionarse en la justificación del TFG. El sistema de planificación de cobertura desarrollado en el TFG debe poder usarse en este contexto operacional, lo que impone requisitos de velocidad y facilidad de uso.

## Conceptos clave
- **PPDR 5G (Public Protection and Disaster Relief):** Categoría de aplicación de 5G para servicios de emergencia y protección civil
- **Células HAPS/UAV:** High Altitude Platform Stations o drones como nodos de red temporal para cobertura rápida
- **Self-backhauling:** La red 5G usa sus propias ondas de radio para el backhaul (Integrated Access and Backhaul, IAB) — clave para autonomía táctica
- **Tiempo de despliegue:** Objetivo para sistemas tácticos: < 30 min para despliegue básico, < 2h para sistema completo
- **Resiliencia:** Capacidad de mantener servicio ante fallos parciales; arquitecturas mesh y redundancia de nodos
- **Cobertura mínima táctica:** Típicamente RSRP > −105 dBm para voz, > −95 dBm para datos de misión crítica
- **Espectro de uso táctico:** Frecuencias licenciadas (n78, n77) o bandas de uso público seguro (PPDR spectrum: 700 MHz, 4.9 GHz)
- **Softwarization:** NFV/SDN para configuración rápida de la red; el operador táctico configura el sistema sin necesitar especialistas de red

## Cómo usar en la memoria
- **Sección:** 2.2 — Requisitos de las redes tácticas 5G
- **Propósito:** Definir los requisitos operacionales (tiempo de despliegue, cobertura mínima, movilidad) que justifican las decisiones de diseño del TFG. Establecer el contexto operacional para el que se desarrolla el sistema.

## Resumen del paper

Chu et al. presentan una arquitectura de redes 5G aéreas de despliegue rápido basadas en O-RAN para conectividad neutral (multi-operador) en áreas sin infraestructura. El sistema utiliza plataformas aéreas (UAV/HAPS) como nodos base 5G, integrados con O-RAN para gestión inteligente de recursos. Es relevante para el TFG porque demuestra la viabilidad del despliegue rápido 5G sin infraestructura fija, que es el escenario táctico del TFG.

## Notas de lectura
> PDF descargado. Leer la sección de arquitectura y los escenarios de despliegue.
> Buscar discusión sobre tiempos de despliegue y cobertura obtenida.
> Anotar parámetros de cobertura para comparar con resultados del TFG.

## Cita BibTeX
```bibtex
@misc{Chu2024_RapidDeploy5G,
  author    = {Chu, Yi and Grace, David and Shackleton, Josh and White, Andy and Hunter, David and Ahmadi, Hamed},
  title     = {Rapidly Deployable Intelligent 5{G} Aerial Neutral Host Networks: an {O-RAN}-Based Approach},
  year      = {2024},
  url       = {https://arxiv.org/abs/2403.11869},
  note      = {arXiv:2403.11869. Red 5G aérea de despliegue rápido con arquitectura O-RAN para cobertura táctica.}
}
```
