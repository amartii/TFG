# TFG - Trabajo de Fin de Grado

## Descripción

Proyecto de Trabajo de Fin de Grado sobre la implementación de un gemelo digital 5G.

## Estructura del Proyecto

```
TFG/
├── docs/                                    # Documentación del proyecto
│   ├── Anteproyecto/                        # Anteproyecto de inicio
│   └── Indice/                              # Índices y propuestas
├── mockups/
│   ├── readme.md                            # Documentación de mockups
│   └── mockup_v1/                           # Primera versión de mockups
│       ├── gemelo-digital-5g/               # Proyecto Angular completo
│       │   ├── src/                         # Código fuente
│       │   │   ├── app/
│       │   │   │   ├── components/          # Componentes Angular
│       │   │   │   ├── services/            # Servicios (simulación)
│       │   │   │   └── models/              # Modelos de datos
│       │   │   ├── assets/                  # Datos y recursos
│       │   │   └── styles/                  # Estilos SCSS
│       │   ├── angular.json                 # Configuración Angular
│       │   ├── package.json                 # Dependencias npm
│       │   └── tsconfig.json                # Configuración TypeScript
│       └── gemelo-digital-5g-demo/          # Demo estática (HTML/CSS/JS)
│           ├── index.html
│           ├── app.js
│           └── styles.css
├── plantilla/
│   └── plantilla-latex-tfg-tfm/             # Plantilla LaTeX para memoria
│       ├── Dockerfile                       # Imagen Docker con TeX Live
│       ├── Makefile                         # Comandos para compilación
│       ├── memoria.tex                      # Documento principal
│       ├── bibliografia.bib                 # Referencias bibliográficas
│       ├── capitulos/                       # Capítulos del TFG
│       ├── portada/                         # Portada y preliminares
│       └── figs/                            # Figuras y gráficos
├── Dockerfile                               # Contenedor del proyecto
├── README.md                                # Este archivo
└── .gitignore                               # Archivos ignorados
```

## Componentes del Proyecto

### 1. Mockup - Gemelo Digital 5G (Angular)

Interfaz interactiva implementada en **Angular** que simula un gemelo digital 5G.

**Ubicación**: `mockups/mockup_v1/gemelo-digital-5g/`

**Características**:
- Mapa interactivo de cobertura
- Panel de información
- Panel de estadísticas
- Barra lateral de navegación
- Configuración de simulaciones
- Leyenda de cobertura

**Requisitos**:
- Node.js (v16 o superior)
- npm

**Instalación y ejecución**:

```bash
cd mockups/mockup_v1/gemelo-digital-5g
npm install
ng serve
# O si no tienes Angular CLI global:
npm start
```

La aplicación estará disponible en `http://localhost:4200`

**Compilación para producción**:

```bash
ng build --configuration production
```

### 2. Demo - Gemelo Digital 5G (HTML/CSS/JS)

Versión estática de demostración sin dependencias externas.

**Ubicación**: `mockups/mockup_v1/gemelo-digital-5g-demo/`

**Características**:
- Interfaz estática simplificada
- Acceso directo sin instalación de dependencias
- Ideal para presentaciones rápidas

**Ejecución**:

Abre directamente `index.html` en un navegador web.

### 3. Plantilla LaTeX - Memoria del TFG


Plantilla profesional para la redacción de la memoria del Trabajo de Fin de Grado.

**Ubicación**: `plantilla/plantilla-latex-tfg-tfm/`

**Estructura**:
- Portada automática
- Capítulos organizados
- Bibliografía integrada
- Índice automático

## Compilación de la Memoria LaTeX

### Compilación con Docker

```bash
cd plantilla/plantilla-latex-tfg-tfm

# Construcción de la imagen
docker build -t tfg-latex .

# Compilación de la memoria
docker run --rm -v "$(pwd):/workspace" tfg-latex make

# Limpia archivos temporales
docker run --rm -v "$(pwd):/workspace" tfg-latex make clean
```

El PDF se generará en `memoria.pdf`.

### Compilación Local

Si tienes TeX Live instalado:

```bash
cd plantilla/plantilla-latex-tfg-tfm
make
```

## Instalación y Configuración

### Requisitos Globales

- Git
- Node.js y npm (para el proyecto Angular)
- Docker (opcional, para compilación de LaTeX)
- TeX Live (opcional, para compilación local de LaTeX)

### Clonar el Repositorio

```bash
git clone https://github.com/amartii/TFG.git
cd TFG
```

### Estructura de Desarrollo

```
# Para trabajar en el mockup Angular
cd mockups/mockup_v1/gemelo-digital-5g/

# Para editar la memoria LaTeX
cd plantilla/plantilla-latex-tfg-tfm/

# Para visualizar documentación
cd docs/
```

## Referencias

- **Plantilla LaTeX TFG**: https://gitlab.eif.urjc.es/jmvega/plantilla-latex-tfg-tfm/-/tree/master
- **Angular Documentation**: https://angular.io/docs
- **TeX Live**: https://www.tug.org/texlive/

## Estado del Proyecto

- [X] Definición del tema
- [X] Creación Plantilla en LaTeX
- [X] Primer mockup en Angular
- [X] Demo estática HTML/CSS/JS
- [ ] Implementación de simulaciones
- [ ] Integración con datos reales 5G
- [ ] Finalización de memoria

## Teknologías Utilizadas

- **Frontend**: Angular 15+, TypeScript, SCSS
- **Documentación**: LaTeX (TeX Live)
- **Control de versiones**: Git / GitHub
- **Contenedorización**: Docker
- **Build Tools**: Angular CLI, Make

## Autor

**Álvaro Martínez Téllez**

Trabajo de Fin de Grado - Curso 2025/2026
