# TFG — Diseño e Implementación de una Herramienta de Gemelo Digital (Digital Twin) para la Planificación y Visualización de Cobertura en Redes 5G Tácticas Desplegables

**Autor:** Álvaro Martínez Téllez  
**Tutor:** Miguel Ángel Ortuño Pérez  
**Grado:** Ingeniería en Sistemas de Telecomunicaciones — URJC, Escuela de Ingeniería de Fuenlabrada  
**Curso académico:** 2025-2026

---

## Descripción

Prueba de concepto (PoC) de una herramienta de Gemelo Digital web para la planificación y visualización de cobertura en redes 5G FR1 (sub-6 GHz) tácticas desplegables. La solución integra tres capas tecnológicas: simulación radioeléctrica en MATLAB (modelo Longley-Rice), backend REST con Spring Boot y frontend Angular con mapas Leaflet.

## Estructura del Proyecto

```
TFG/
├── docs/                                    # Documentación del proyecto
│   ├── Anteproyecto/                        # Anteproyecto del TFG (PDF + DOCX)
│   └── Indice/                              # Propuesta de índice de la memoria
├── mockups/
│   └── mockup_v1/                           # Primera iteración del prototipo visual
│       ├── gemelo-digital-5g/               # Mockup Angular (interfaz interactiva)
│       │   ├── src/app/
│       │   │   ├── components/              # MapComponent, SidebarComponent, etc.
│       │   │   ├── services/                # SimulationService
│       │   │   └── models/                  # Modelos de datos
│       │   ├── angular.json
│       │   └── package.json
│       └── gemelo-digital-5g-demo/          # Demo estática HTML/CSS/JS
├── TFG GD5G/                                # Memoria del TFG en LaTeX
│   ├── memoria.tex                          # Documento principal
│   ├── estilo.tex                           # Estilos (soporte MATLAB, Java, TypeScript)
│   ├── bibliografia.bib                     # Referencias bibliográficas
│   ├── Makefile                             # Compilación local (pdflatex + bibtex)
│   ├── Dockerfile                           # Compilación con Docker (TeX Live)
│   ├── .gitignore                           # Ignora artefactos LaTeX
│   ├── portada/
│   │   ├── portada.tex                      # Portada oficial URJC
│   │   ├── resumen.tex                      # Resumen en español
│   │   ├── abstract.tex                     # Abstract en inglés
│   │   ├── agradecimientos.tex
│   │   ├── dedicatoria.tex
│   │   ├── acronimos.tex                    # Lista de acrónimos (5G, RSRP, API…)
│   │   ├── licencia.tex                     # Licencia CC BY-SA
│   │   └── indice.tex                       # Carga todas las páginas preliminares
│   ├── capitulos/
│   │   ├── capitulo1.tex                    # Introducción
│   │   ├── capitulo2.tex                    # Estado del Arte
│   │   ├── capitulo3.tex                    # Análisis y Diseño
│   │   ├── capitulo4.tex                    # Implementación
│   │   ├── capitulo5.tex                    # Validación y Resultados
│   │   ├── capitulo6.tex                    # Conclusiones y Trabajo Futuro
│   │   └── anexos.tex                       # Anexos A-F
│   └── figs/
│       ├── logo_urjc.jpg                    # Logo URJC (portada)
│       └── by-sa.png                        # Imagen licencia CC BY-SA
├── versiones memoria/                       # PDFs compilados de la memoria
│   ├── memoria_v1_indice_limpio.pdf         # v1: solo títulos de sección
│   └── memoria_v2_plantilla_comentarios.pdf # v2: guías de contenido en cursiva
├── Dockerfile                               # Contenedor del proyecto
├── README.md                                # Este archivo
└── .gitignore
```

## Componentes del Proyecto

### 1. Memoria LaTeX (`TFG GD5G/`)

Memoria del TFG estructurada en 6 capítulos + 6 anexos, lista para ir rellenando progresivamente.

**Compilación local** (requiere MiKTeX o TeX Live):

```bash
cd "TFG GD5G"
make          # ejecuta pdflatex + bibtex + pdflatex x2
make clean    # elimina artefactos de compilación
```

**Compilación con Docker**:

```bash
cd "TFG GD5G"
docker build -t tfg-latex .
docker run --rm -v "$(pwd):/workspace" tfg-latex make
```

### 2. Mockup Angular (`mockups/mockup_v1/gemelo-digital-5g/`)

Prototipo visual de la interfaz web del gemelo digital con mapa de cobertura interactivo.

**Requisitos:** Node.js ≥ 16, Angular CLI 17

```bash
cd mockups/mockup_v1/gemelo-digital-5g
npm install
ng serve        # disponible en http://localhost:4200
```

### 3. Demo estática (`mockups/mockup_v1/gemelo-digital-5g-demo/`)

Versión HTML/CSS/JS sin dependencias. Abrir `index.html` directamente en el navegador.

## Estado del Proyecto

- [x] Anteproyecto aprobado
- [x] Propuesta de índice definida
- [x] Estructura de memoria LaTeX creada
- [x] Mockup Angular v1
- [x] Demo estática HTML/CSS/JS
- [ ] Simulación MATLAB (motor Longley-Rice)
- [ ] Backend Spring Boot (API REST)
- [ ] Frontend Angular definitivo
- [ ] Validación con escenario real (URJC Fuenlabrada)
- [ ] Memoria finalizada

## Tecnologías

| Capa | Tecnología |
|---|---|
| Simulación | MATLAB R2024a, Antenna Toolbox, Longley-Rice |
| Backend | Java 17, Spring Boot 3, Maven, OpenAPI/Swagger |
| Frontend | Angular 17, TypeScript, Leaflet, leaflet.heat |
| Memoria | LaTeX (MiKTeX / TeX Live), pdflatex + bibtex |
| Control de versiones | Git / GitHub |

## Referencias

- Plantilla LaTeX URJC: https://gitlab.eif.urjc.es/jmvega/plantilla-latex-tfg-tfm
- Angular: https://angular.dev
- Spring Boot: https://spring.io/projects/spring-boot
- Leaflet: https://leafletjs.com
