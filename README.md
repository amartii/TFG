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
- `mockups/`: prototipos y demos de la interfaz.
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

Los cuatro comandos para tener todo el sistema corriendo en local:

```powershell
# 1. Generar (o regenerar) las simulaciones de referencia en MATLAB
#    Abrir MATLAB en la carpeta `matlab/` y ejecutar:
generar_escenarios

# 2. Arrancar el backend Spring Boot (sirve los JSON de matlab/output)
cd backend; mvn spring-boot:run

# 3. Instalar dependencias del frontend (solo la primera vez)
cd mockups/mockup_v1/gemelo-digital-5g; npm install

# 4. Arrancar el frontend Angular (http://localhost:4200)
cd mockups/mockup_v1/gemelo-digital-5g; ng serve
```

### Cartografía vectorial offline (opcional)

Para servir los tiles del mapa desde un fichero local (sin depender del CDN de Protomaps):

```powershell
cd mockups/mockup_v1/gemelo-digital-5g
pwsh ./scripts/download-pmtiles.ps1
```

El script intenta primero un *extract* optimizado de la Península Ibérica (~25–50 MB) usando la CLI oficial [`pmtiles`](https://github.com/protomaps/go-pmtiles/releases). Si esa CLI no está instalada, ofrece descargar el `v4.pmtiles` mundial completo de Protomaps (>1 GB), opción solo recomendable si se necesita cobertura mundial sin conexión.

El fichero queda en `src/assets/tiles/spain.pmtiles` y el frontend lo detecta automáticamente.

## Nota

Este README tiene un carácter general y sirve como punto de entrada al repositorio. La información más específica de cada parte del proyecto se mantiene en sus carpetas y documentos correspondientes.
