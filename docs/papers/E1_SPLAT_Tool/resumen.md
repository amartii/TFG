# SPLAT! — RF Signal Propagation, Loss, And Terrain Analysis Tool

## Datos bibliográficos
- **Autor:** John A. Magliacane (KD2BD)
- **Año:** 1997–2014 (versión 1.4.2, lanzada el 8 de diciembre de 2014)
- **Tipo:** Software open source (GNU GPL v2)
- **URL principal:** https://www.qsl.net/kd2bd/splat.html
- **GitHub:** https://github.com/kd2bd/splat
- **Licencia:** GNU General Public License Version 2

## Relevancia para el TFG
SPLAT! es la herramienta open-source de análisis de cobertura RF más establecida y documentada que implementa el modelo Longley-Rice. Es la referencia de comparación directa para el sistema MATLAB desarrollado en el TFG: ambos sistemas hacen esencialmente lo mismo (calcular cobertura RF con ITM sobre datos de terreno SRTM), pero con diferentes enfoques de implementación, interfaz y plataforma.

La comparación con SPLAT! es útil para la Sección 2.4 (herramientas existentes) y para la Sección 5.4 (tabla comparativa). Las ventajas del TFG respecto a SPLAT!: integración nativa en MATLAB, GUI orientada al usuario no técnico, exportación directa de resultados en formatos de análisis, y posibilidad de integración con otros módulos del gemelo digital. Las ventajas de SPLAT!: software maduro, probado, con extensa documentación y casos de uso verificados en radioafición y telecomunicaciones profesionales.

El código fuente de SPLAT! (C++, ~10.000 líneas) también puede servir como referencia de implementación para verificar la corrección del motor ITM del TFG, especialmente los detalles de interfaz con los datos de elevación SRTM.

## Conceptos clave
- **Modelo de propagación:** Longley-Rice (ITM) e ITWOM v3.0 (Irregular Terrain with Obstructions Model, versión extendida con pérdidas por obstáculos)
- **Plataforma:** Linux/Unix; compilable en macOS; no nativo en Windows (requiere WSL)
- **Datos de elevación:** Compatible con modelos SRTM (formato .sdf custom de SPLAT!) y USGS DEM
- **Salidas:** Mapas de pérdida de trayectoria en formato georreferenciado (.geo), KML para Google Earth, perfiles de terreno, informes de obstrucciones
- **Visualización:** Genera imágenes PPM de mapas de cobertura con paleta de colores configurable
- **Cálculo punto-a-punto:** Genera el perfil de terreno entre TX y RX y calcula la pérdida total
- **Modo de cobertura:** Calcula la cobertura desde una estación transmisora en radio circular o en un área rectangular
- **Herramientas auxiliares:** srtm2sdf (convierte SRTM HGT a formato SPLAT!), citydecoder, postdownload

## Cómo usar en la memoria
- **Sección:** 2.4 — Herramientas open-source de análisis de cobertura RF
- **Propósito:** Describir SPLAT! como referencia de comparación. Mencionar que el TFG implementa funcionalidad equivalente en MATLAB con una interfaz más integrada.

## Notas de lectura
> README del repositorio GitHub obtenido (ver contenido en A2 NTIA — referencia cruzada).
> SPLAT! es mantenido principalmente por la comunidad de radioaficionados.
> Última versión (1.4.2, 2014) indica que el proyecto está en modo mantenimiento.
> El GitHub tiene forks activos con mejoras (buscar en github.com/topics/splat-rf).
>
> Para comparación técnica con el TFG:
> - Examinar el archivo `itm.cpp` de SPLAT! para comparar con la implementación NTIA
> - Los archivos .sdf usan el mismo perfil de terreno que el formato PFL del ITM

## Cita BibTeX
```bibtex
@misc{SPLAT_Tool,
  author       = {Magliacane, John A.},
  title        = {{SPLAT!}: {RF} Signal Propagation, Loss, and Terrain Analysis Tool},
  year         = {2014},
  version      = {1.4.2},
  howpublished = {\url{https://www.qsl.net/kd2bd/splat.html}},
  note         = {Open source RF coverage analysis tool based on the Longley-Rice (ITM) model. GNU GPL v2.}
}
```
