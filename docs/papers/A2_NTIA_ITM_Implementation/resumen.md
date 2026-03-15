# Irregular Terrain Model (ITM) — Reference Implementation

## Datos bibliográficos
- **Autores/Organización:** NTIA/ITS (National Telecommunications and Information Administration / Institute for Telecommunication Sciences)
- **Año:** Mantenimiento activo (versión C++ moderna; implementación FORTRAN original 1968)
- **Publicación:** Repositorio GitHub público
- **DOI/URL:** https://github.com/NTIA/itm
- **Contacto técnico:** Paul McKenna, pmckenna@ntia.gov

## Relevancia para el TFG
Este repositorio contiene la implementación de referencia en C++ del modelo Irregular Terrain Model (ITM), que es la versión computacional del modelo matemático descrito por Longley y Rice (1968). Su importancia para el TFG es doble: por un lado, es la fuente canónica del algoritmo que debe replicarse o portarse para el motor MATLAB; por otro, sirve como referencia para verificar que los resultados del script MATLAB son correctos.

La implementación C++ puede integrarse en MATLAB mediante el mecanismo MEX (MATLAB Executable), que permite compilar código C/C++ y llamarlo directamente desde scripts MATLAB. Esto permitiría usar la implementación oficial NTIA dentro del entorno MATLAB del TFG, garantizando la fidelidad matemática con el estándar.

La biblioteca está diseñada como DLL/librería multiplataforma, y también incluye una envoltura C#/.NET y una herramienta de línea de comandos. La nomenclatura del código sigue convenciones muy explícitas (subíndices con guión bajo simple, unidades con doble guión bajo), lo que facilita trazar las variables hasta las ecuaciones del paper original.

## Conceptos clave
- **Frecuencia de operación:** 20 MHz – 20 GHz
- **Modos de predicción:** Punto a punto (requiere perfil de terreno en formato PFL) y modo área (usa parámetros estadísticos del terreno)
- **Mecanismos modelados:** Pérdida en espacio libre, difracción, dispersión troposférica
- **Entradas principales:** Alturas de antena (0.5–3000 m), frecuencia, polarización, permitividad y conductividad del suelo, clima radioeléctrico (7 categorías), refractividad superficial N₀
- **Salida principal:** Pérdida básica de transmisión L_b en dB + flags de advertencia
- **Formato PFL:** Profile of terrain data, lista de alturas de terreno equiespaciadas entre TX y RX
- **Integración MEX:** Posibilidad de compilar el C++ como función MATLAB mediante mex()
- **Equivalencia con FORTRAN 1.2.2:** El código C++ mantiene equivalencia funcional con la implementación FORTRAN original

## Cómo usar en la memoria
- **Sección:** 2.3 — Motor de propagación MATLAB
- **Propósito:** Referenciar como implementación oficial del ITM. Mencionar la posibilidad de integración vía MEX. Usar para justificar la validez de la implementación MATLAB del TFG comparándola con el código NTIA.

## Notas de lectura
> TODO: Revisar el archivo `src/ITM.cpp` para entender la estructura del código.
> Evaluar la viabilidad de compilar como MEX para MATLAB R202x.
> Descargar la DLL precompilada de la sección Releases del repositorio.
> Leer el documento de errores/advertencias referenciado en el README.

## Cita BibTeX
```bibtex
@misc{NTIA_ITM,
  author       = {{NTIA/ITS}},
  title        = {Irregular Terrain Model ({ITM}) -- Reference {C++} Implementation},
  year         = {2023},
  publisher    = {GitHub},
  journal      = {GitHub repository},
  howpublished = {\url{https://github.com/NTIA/itm}},
  note         = {C++ implementation of the Longley-Rice propagation model, maintained by the National Telecommunications and Information Administration}
}
```
