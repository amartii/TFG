# CloudRF — Web-based RF Coverage Planning Tool

## Datos bibliográficos
- **Organización:** CloudRF (Squire Technologies Ltd., UK)
- **Año:** 2012–presente (servicio SaaS activo)
- **Tipo:** Herramienta comercial web (freemium) con API REST
- **URL:** https://cloudrf.com
- **Modelo de negocio:** Freemium (gratuito para áreas < 10 km², de pago para mayor cobertura y funciones avanzadas)

## Relevancia para el TFG
CloudRF es la herramienta web comercial más próxima en concepto al sistema desarrollado en el TFG. Ambos sistemas calculan mapas de cobertura RF usando el modelo Longley-Rice con datos de elevación SRTM, presentan los resultados en un mapa interactivo, y permiten configurar los parámetros de la estación base. La comparación entre CloudRF y el TFG es la más relevante de la tabla comparativa de la Sección 5.4.

Las diferencias clave entre CloudRF y el TFG son: (1) CloudRF es un SaaS accesible desde cualquier navegador, mientras que el TFG es una aplicación MATLAB que requiere instalación local; (2) CloudRF tiene engine propietario (SLEIPNIR con aceleración GPU), mientras que el TFG usa el ITM open source; (3) CloudRF no está diseñado específicamente para integración con un gemelo digital táctico ni para exportar resultados al formato de análisis que necesita el TFG.

Para el TFG, CloudRF sirve como validación cualitativa: si el mapa de cobertura del TFG es visualmente similar al generado por CloudRF para los mismos parámetros y la misma ubicación, eso es un indicador de que el motor ITM está funcionando correctamente.

## Conceptos clave
- **Motor SLEIPNIR:** Motor de propagación propietario de CloudRF con aceleración GPU; más rápido que el ITM clásico para coberturas grandes
- **Phase Tracing:** Funcionalidad avanzada para modelar reflexiones, multitrayecto y efectos 3D (indoor, materiales)
- **API REST:** Interfaz programática que permite integrar CloudRF en aplicaciones externas; posible integración con el TFG para comparación
- **Modelos de propagación soportados:** Longley-Rice (ITM), ITWOM, modelos simplificados para propagación urbana
- **Datos de terreno globales:** SRTM 90m, SRTM 30m, datasets propietarios de alta resolución
- **Datos de clutter:** Modelos de vegetación y edificios para mejorar la precisión en entornos urbanos
- **Salidas:** Mapas PNG georreferenciados, KML para Google Earth, archivos GeoJSON, integración con ATAK (sistema de mando táctico militar)
- **Interfaz ATAK:** Integración nativa con Android Team Awareness Kit — relevante para uso táctico militar del TFG

## Cómo usar en la memoria
- **Sección:** 2.4 — Herramientas de planificación de cobertura RF (descripción)
- **Sección:** 5.4 — Tabla comparativa de herramientas
- **Propósito:** Usar CloudRF como referencia principal de comparación. Destacar la integración ATAK como caso de uso similar al del TFG. Mencionar las limitaciones de CloudRF para uso offline/táctico.

## Notas de lectura
> Página web recuperada exitosamente.
> CloudRF soporta integración con ATAK (Android Team Awareness Kit) — dato muy relevante
> para el TFG dado que ATAK es ampliamente usado por Fuerzas y Cuerpos de Seguridad.
> La funcionalidad freemium (áreas < 10km) es suficiente para probar la herramienta.
>
> Para la comparación con el TFG:
> - Ejecutar CloudRF con los mismos parámetros (frecuencia, potencia, posición) que el TFG
> - Comparar mapas de cobertura cualitativamente
> - Documentar diferencias en los modelos de terreno usados

## Cita BibTeX
```bibtex
@misc{CloudRF,
  author       = {{CloudRF / Squire Technologies Ltd.}},
  title        = {{CloudRF}: Web-based {RF} Coverage Planning Tool},
  year         = {2024},
  howpublished = {\url{https://cloudrf.com}},
  note         = {Commercial SaaS RF coverage tool supporting Longley-Rice and SLEIPNIR propagation engines. Freemium model with ATAK integration.}
}
```
