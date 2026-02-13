# TFG - Trabajo de Fin de Grado

## Descripción

Proyecto de Trabajo de Fin de Grado.

## Estructura del Proyecto

```
TFG/
├── docs/                                    # Documentación del proyecto
├── plantilla/
│   └── plantilla-latex-tfg-tfm/
│       ├── .devcontainer/                   # Configuración del dev container
│       ├── Dockerfile                       # Imagen Docker con TeX Live
│       ├── Makefile                         # Comandos para compilación
│       ├── memoria.tex                      # Documento principal
│       ├── bibliografia.bib                 # Referencias bibliográficas
│       ├── capitulos/                       # Capítulos del TFG
│       ├── portada/                         # Portada y preliminares
│       └── figs/                            # Figuras y gráficos
├── resources/                               # Recursos, imágenes adicionales
└── README.md                                # Este archivo
```

## Compilación con Docker

La configuración de Docker se encuentra dentro de la carpeta de la plantilla LaTeX, ya que solo se utiliza para compilar el documento.

### Requisitos

- Docker instalado en tu sistema
- Sistema operativo: Linux, macOS o Windows con WSL2

### Construcción de la imagen

Accede a la carpeta de la plantilla y construye la imagen Docker con TeX Live:

```bash
cd plantilla/plantilla-latex-tfg-tfm
docker build -t tfg-latex .
```

### Compilación de la memoria

Desde la carpeta `plantilla/plantilla-latex-tfg-tfm`, compila el documento:

```bash
docker run --rm -v "$(pwd):/workspace" tfg-latex make
```

### Comandos de compilación disponibles

```bash
# Compilación estándar
docker run --rm -v "$(pwd):/workspace" tfg-latex make

# Limpia archivos temporales
docker run --rm -v "$(pwd):/workspace" tfg-latex make clean

# Genera solo el PDF
docker run --rm -v "$(pwd):/workspace" tfg-latex make pdf

# Limpia y recompila
docker run --rm -v "$(pwd):/workspace" tfg-latex make clean && docker run --rm -v "$(pwd):/workspace" tfg-latex make
```

### Resultado

El archivo PDF compilado se generará en:

```
memoria.pdf
```

### Dev Container en VS Code

Si utilizas VS Code con la extensión Remote - Containers, el proyecto incluye una configuración `.devcontainer/` que:

- Instala automáticamente TeX Live completo
- Configura la extensión LaTeX Workshop
- Permite compilación directa desde el editor con compilación automática al guardar

Para activarlo:
1. Abre la carpeta `plantilla/plantilla-latex-tfg-tfm/` en VS Code
2. VS Code detectará automáticamente la configuración del dev container
3. Haz clic en "Reopen in Container" cuando se sugiera

## Referencias

- **Plantilla LaTeX TFG**: https://gitlab.eif.urjc.es/jmvega/plantilla-latex-tfg-tfm/-/tree/master

## Estado del Proyecto

- [X] Definición del tema

## Autor

Álvaro Martínez Téllez
