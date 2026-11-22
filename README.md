# TFG — Gemelo Digital para Redes 5G Tácticas

**Autor:** Álvaro Martínez Téllez  
**Tutor:** Miguel Ángel Ortuño Pérez  
**Grado:** Ingeniería en Sistemas de Telecomunicaciones — URJC  
**Curso académico:** 2025-2026

---

## Descripción

Este repositorio recoge el trabajo asociado al TFG sobre el diseño e implementación de una herramienta de gemelo digital para la planificación y visualización de cobertura en redes 5G tácticas desplegables.

El proyecto se encuentra en desarrollo e integra documentación, prototipos y distintos componentes de apoyo para la parte técnica y experimental.

## Estructura general

El repositorio se organiza, de forma general, en las siguientes áreas:

- `docs/`: documentación de trabajo y materiales de apoyo.
- `frontend/`: aplicación Angular del gemelo digital.
- `mockups/`: prototipos y demos de interfaz.
- `matlab/`: scripts y salidas relacionadas con simulación y validación.
- `TFG GD5G/`: memoria del TFG en LaTeX.
- `versiones memoria/`: versiones exportadas de la memoria.

## Estado del repositorio

Actualmente el repositorio contiene material en distintas fases de desarrollo y revisión. Su contenido irá evolucionando conforme avance el TFG, tanto en la parte documental como en la técnica.

## Tecnologías principales

- MATLAB
- Java / Spring Boot
- Angular / TypeScript
- LaTeX
- Git / GitHub

## Cómo arrancar el gemelo digital

### Demo local con Docker Compose

Con Docker Engine y Compose, desde la raíz:

```powershell
docker compose up --build
```

Abrir http://localhost:4200; la API está en http://localhost:8080/api/simulations
y Swagger en http://localhost:8080/swagger-ui.html. Los puertos se publican
solo en localhost. La primera compilación descarga imágenes y dependencias;
no descarga cartografía ni terreno.

La demo genera durante la compilación un GeoTIFF **sintético** pequeño, con
relieve artificial alrededor de Fuenlabrada. Las simulaciones creadas en ella
registran esa procedencia: son ilustrativas y no datos SRTM ni resultados
validados. Solo pueden calcularse dentro de la extensión sintética mostrada.
También se incluye una simulación ilustrativa fija de nueve puntos.

Las simulaciones se guardan en un volumen Docker dedicado, escribible por el
backend, sin montar ni modificar `matlab/output` ni otras carpetas del usuario.
Los reinicios conservan ese volumen; si se elimina la muestra fija, se vuelve
a copiar en el siguiente arranque. `docker compose down` detiene los servicios
y conserva los datos. `docker compose down -v` elimina **todos** los datos del
volumen de esta demo.

Los mapas base y los iconos utilizan servicios externos y requieren Internet;
sin ella el fondo puede quedar vacío. La demo no ejecuta MATLAB.

### Ejecución sin contenedores

El backend Java no requiere MATLAB para arrancar. Para simular cobertura necesita el GeoTIFF configurado en `terrain.srtm-path`; los JSON de referencia se pueden regenerar opcionalmente con MATLAB.

Desde la raíz del repositorio, arrancar el backend en una terminal:

```powershell
cd backend; mvn spring-boot:run
```

En otra terminal, también desde la raíz, instalar las dependencias del frontend la primera vez y arrancarlo en http://localhost:4200:

```powershell
cd frontend
npm install
npm start
```

Para regenerar opcionalmente las simulaciones de referencia, abrir MATLAB en `matlab/` y ejecutar:

```matlab
generar_escenarios
```

### Cartografía vectorial offline (opcional)

Para servir los tiles del mapa desde un fichero local (sin depender del CDN de Protomaps):

```powershell
cd frontend
pwsh ./scripts/download-pmtiles.ps1
```

El script intenta primero un *extract* optimizado de la Península Ibérica (~25–50 MB) usando la CLI oficial [`pmtiles`](https://github.com/protomaps/go-pmtiles/releases). Si esa CLI no está instalada, ofrece descargar el `v4.pmtiles` mundial completo de Protomaps (>1 GB), opción solo recomendable si se necesita cobertura mundial sin conexión.

El fichero queda en `src/assets/tiles/spain.pmtiles` y el frontend lo detecta automáticamente.

### Simulación bajo demanda

En el dashboard, selecciona **Colocar o mover antena en el mapa**, haz clic en la ubicación y pulsa **Simular**. El mapa muestra la cobertura calculada y la extensión del raster de terreno. El histórico permite abrir o borrar escenarios y comparar dos simulaciones.

El backend expone `POST /api/simulations`. El cuerpo contiene los parámetros de cobertura y exactamente un transmisor en `transmitters`:

```json
{
  "name": "Escenario de prueba",
  "frequencyGHz": 3.5,
  "rxHeightM": 1.5,
  "areaKm": 3,
  "gridSpacingM": 50,
  "cableLossDb": 2,
  "transmitters": [
    {
      "latitude": 40.2897,
      "longitude": -3.8244,
      "txHeightM": 30,
      "txPowerDbm": 40,
      "txGainDbi": 15
    }
  ]
}
```

La respuesta mantiene la estructura de los JSON MATLAB (`metadata`, `parameters` y `coveragePoints`) y se persiste en `simulations.data-dir`. La rejilla está centrada en el transmisor y cada punto incluye latitud, longitud y RSRP estimada. Los JSON históricos permanecen legibles y no se reescriben. El GeoTIFF se configura con `terrain.srtm-path` (por defecto `../matlab/data/srtm_fuenlabrada.tif`, relativo al directorio de ejecución del backend); no se descargan datos al ejecutar. Una petición se limita a 100.000 puntos y 20 millones de muestras estimadas de perfiles; el área y los perfiles deben quedar cubiertos por el raster.

El motor usa el lector GeoTIFF ImageIO incluido en Java 17 y estima pérdida como FSPL más difracción Deygout sobre un perfil del raster configurado, muestreado a `max(30 m, espaciado de rejilla)`, con radio terrestre efectivo 4/3. Calcula `EIRP = Ptx + Gtx − Lcable` (Grx = 0 dBi) y normaliza RSRP con `10·log10(66·12)`, limitado a [−140, −40] dBm. Es una aproximación punto-área: no equivale a Longley–Rice ni a COST-231 y no modela edificios; las opciones simplificadas de antena y clutter se describen abajo. La calibración ajusta el proxy de potencia guardado; no altera el cálculo de propagación.

### Opciones radioeléctricas y perfil del enlace

En una simulación bajo demanda se pueden activar opcionalmente los campos `antennaAzimuthDeg` y `antennaDowntiltDeg` del transmisor: azimut en grados (0° norte, horario; se admite 360° como norte) e inclinación mecánica en grados (positiva hacia abajo, de −90° a 90°). Deben indicarse ambos. El prototipo usa una aproximación direccional parabólica separable con anchos de haz nominales de 65° horizontal y 10° vertical, atenuación combinada limitada a 30 dB y la ganancia TX configurada como máximo en el eje. No representa un diagrama medido ni una antena concreta. Si se omiten, se mantiene el modelo isotrópico previo.

El parámetro opcional `clutterLossDb` aplica una pérdida manual de 0 a 40 dB sumada al presupuesto de pérdidas. No proviene de mapas, clases de uso del suelo ni mediciones y no permite inferir el clutter del escenario; si se omite no altera el cálculo anterior.

Para consultar un perfil asociado a un escenario guardado, enviar `POST /api/simulations/{id}/link-profile` con `{"receiverLatitude": 40.30, "receiverLongitude": -3.82}`. El TX, frecuencia, altura RX y espaciado proceden del escenario, y el backend toma las elevaciones del raster configurado. El perfil se muestrea con paso `max(30 m, espaciado de rejilla)`, usa radio terrestre efectivo 4/3 y devuelve línea TX–RX, terreno efectivo y radio/contornos de la primera zona de Fresnel; la interfaz lo dibuja. Se limita la distancia a 100 km. Si faltan parámetros, el escenario no identifica una única antena o el trayecto sale del raster, se informa el error. No hay un conjunto de clutter real disponible en el prototipo: esta visualización no lo inventa ni presenta predicciones como mediciones.

### Observaciones y calibración local

Seleccionar un escenario guardado y abrir **Observaciones y calibración**. Se importa un archivo JSON con el siguiente formato (añadir registros independientes tanto de `fit` como de `holdout`):

```json
{
  "observations": [
    {
      "latitude": 40.2897,
      "longitude": -3.8244,
      "value": -95,
      "unit": "dBm",
      "quantity": "prototype_power_proxy",
      "timestamp": "2026-01-01T10:00:00Z",
      "provenance": "synthetic",
      "source": "ejemplo sintético",
      "split": "fit"
    }
  ]
}
```

La fecha es ISO 8601 con zona, las coordenadas son grados WGS84 y `provenance` es `real` o `synthetic`; `source` debe identificar la fuente. El ejemplo es sintético, no una medición. La magnitud aceptada es exclusivamente el proxy de potencia del prototipo: no se considera SS-RSRP físicamente equivalente y los registros identificados como tal se rechazan. Los valores admitidos están entre -300 y 100 dBm.

El emparejamiento usa el punto de malla más próximo por distancia geodésica (Haversine), dentro de los extremos de la malla y a no más de `min(0,75 × espaciado, 100 m)`. Se admiten hasta 10.000 observaciones y 10 millones de comparaciones (número de observaciones por puntos de malla); se rechaza la importación si supera ese límite. Se descartan con motivo los registros inválidos, incompatibles o fuera del dominio; una observación de reserva que comparte punto de predicción con el ajuste se descarta para evitar fuga. Debe quedar al menos un punto válido en cada conjunto. El offset es la media de `observación − predicción` **solo en ajuste**. El sesgo es la media de `predicción − observación` y el RMSE se calcula sobre la reserva, antes y después de sumar el offset.

La API ofrece `POST /api/simulations/{id}/calibrations` con el JSON anterior y `GET` en la misma ruta para reabrir resultados. Se guardan separados por escenario en `calibrations/{id}` dentro de `simulations.data-dir`, sin modificar el JSON original: un archivo corrupto de otro escenario no impide consultar el propio. Un resultado corrupto del escenario consultado produce un error; los resultados antiguos válidos almacenados directamente en `calibrations` siguen siendo legibles, mientras que los antiguos corruptos, cuya procedencia no puede determinarse, se omiten con una advertencia en el log. Cada resultado conserva observaciones originales, descartes, emparejamientos, versión y SHA-256 de la predicción serializada; si la predicción cambia, se avisa y no se aplica el offset a la malla actual. La vista presenta puntos, residuos y valores originales y corregidos por separado. Sin observaciones válidas en ambos conjuntos no se guarda un resultado.

`GET /api/terrain/extent` consulta los límites y la resolución del GeoTIFF realmente configurado, junto con su valor NoData y si se detectaron celdas NoData. El mapa dibuja esta extensión con un contorno discontinuo; no representa una máscara de validez por píxel. La interfaz avisa si el transmisor o el área solicitada rebasa esos límites, y el backend devuelve `503` si el raster falta o no se puede leer.

### Comparación reproducible Java–MATLAB

El control sintético independiente, el procedimiento reproducible y las
limitaciones de la comparación histórica están documentados en
[`matlab/COMPARACION_JAVA_MATLAB.md`](matlab/COMPARACION_JAVA_MATLAB.md).
El control compara perfiles sintéticos con la misma geometría, balance,
normalización y terreno; no usa medidas de campo. La comparación de escenarios
históricos es descriptiva y no debe presentarse como validación homogénea.

La cuadrícula de Java trata `gridSpacingM` como espaciado máximo solicitado: el número de intervalos es `ceil(area/gridSpacingM)`, se incluyen ambos extremos y `espaciado_grid_m` registra el espaciado efectivo (`area/(N−1)`). `espaciado_grid_solicitado_m` conserva el valor de entrada. Los generadores MATLAB con un número de puntos fijado también escriben el espaciado efectivo. Los JSON ya existentes no se reescriben y pueden conservar sus metadatos de espaciado anteriores.

## Nota

Este README tiene un carácter general y sirve como punto de entrada al repositorio. La información más específica de cada parte del proyecto se mantiene en sus carpetas y documentos correspondientes.

## Recomendación local de emplazamientos

En el mapa, «Recomendación de emplazamientos» permite seleccionar el centro
de un área cuadrada o dibujar un polígono mediante clics, deshacer el último
vértice y cerrar la figura, configurar la rejilla y pedir hasta N nodos. El endpoint
`POST /api/recommendations` calcula cada enlace con el motor FSPL+Deygout
y el GeoTIFF configurado; no usa medidas ni guarda simulaciones. El umbral
se aplica al proxy normalizado 66×12 del motor, no a SS-RSRP normativo.
La recomendación usa transmisores isotrópicos y clutter manual nulo; no toma
las opciones direccionales ni el clutter del formulario de simulación.

Los candidatos y los puntos objetivo son dos rejillas uniformes que incluyen
los bordes. En modo polígono se construyen sobre su envolvente y se conservan
solo los puntos interiores o en su contorno; la cobertura se refiere a estos
objetivos válidos. La solicitud JSON acepta `polygon` como lista de objetos
`{"latitude": ..., "longitude": ...}`; si se omite se usa el área cuadrada.
Un greedy escoge en cada paso el candidato que más puntos aún no
cubiertos añade; los empates se resuelven por orden de longitud y luego
latitud crecientes. Termina antes de N si ningún nodo aporta cobertura.
Los marcadores, el área, las ganancias marginales y la cobertura acumulada
son una propuesta explicable, no un óptimo global ni una evaluación de
capacidad, viabilidad física o conectividad entre emplazamientos.

El servidor valida antes de calcular: área 0,1–5 km de lado, 2–8 candidatos
por lado, 2–15 objetivos por lado, 1–10 nodos y umbral −139 a −40 dBm;
máximo 14.400 enlaces y 1.500.000 muestras de perfil estimadas, con paso
100 m. Se rechazan áreas que cruzan el antimeridiano o ±85° de latitud.
Los polígonos deben ser simples, sin cruces ni vértices repetidos, con 3–100
vértices y una envolvente de hasta 5 km por eje; se admiten cóncavos y se
rechazan las rejillas sin candidatos u objetivos interiores o de contorno.
Si falta terreno en cualquier trayectoria, se rechaza la petición completa;
no se sustituyen alturas ni se ocultan puntos. La estimación de cobertura
solo se refiere a los puntos de la rejilla objetivo.
