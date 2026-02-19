**Mockup de Frontend completo para el Gemelo Digital 5G** de planificación de cobertura de burbujas tácticas.

## Características Implementadas

### Interfaz Principal

* **Header profesional** con logo animado, indicadores de estado del sistema y banda de frecuencia (FR1 - 3.5 GHz)
* **Sidebar interactivo** con:
  * Selector de simulaciones (Campus URJC, Sierra de Madrid, Centro de Madrid)
  * Panel de parámetros TX (frecuencia, potencia EIRP, altura de antena, modelo de propagación)
  * Filtro de cobertura RSRP con slider interactivo (-140 a -40 dBm)
  * Leyenda de niveles de señal con código de colores
  * Panel de estadísticas con distribución de cobertura

### Mapa Interactivo (Leaflet.js)

* **Heatmap de cobertura** con ~3,600 puntos por simulación
* **Marcador del transmisor** con animación y popup informativo
* **Controles de mapa** : centrar en TX, toggle heatmap, ajustar vista
* **Panel de información** al hacer clic en cualquier punto de cobertura

### Datos de Simulación

* **3 escenarios demo**:
  **1.**Campus URJC Fuenlabrada (entorno mixto)

  **2.**Sierra de Madrid (zona rural)

  **3.**Centro de Madrid (urbano denso)
* Modelo de propagación **Longley-Rice** simplificado con variabilidad de terreno

### Arquitectura

**gemelo-digital-5g (Angular):**

```
src/
├── app.component.ts              → Componente raíz
├── components/                   → Componentes reutilizables
│  ├── header/
│  ├── sidebar/
│  ├── map/
│  ├── info-panel/
│  ├── stats-panel/
│  └── coverage-legend/
├── services/
│  └── simulation.service.ts      → Gestión estado con signals
├── models/
│  └── simulation.model.ts        → Interfaces TypeScript
└── assets/data/
   └── demo-simulations.ts        → Datos simulados (132 líneas)
```

**gemelo-digital-5g-demo (Vanilla JS):**

```
├── index.html                    → 878 líneas (HTML + Estructura)
├── app.js                        → 645 líneas (Lógica JavaScript)
└── styles.css                    → 1,277 líneas (Estilos)
```
