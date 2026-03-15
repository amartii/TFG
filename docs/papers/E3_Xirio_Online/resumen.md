# Xirio Online — Herramienta Comercial de Planificación Radioeléctrica

## Datos bibliográficos
- **Organización:** Abengoa / Teltel (empresa española)
- **Año:** 2000s–presente (plataforma activa)
- **Tipo:** Herramienta comercial web de planificación radioeléctrica (pago por uso / licencia corporativa)
- **URL:** https://www.xirio-online.com
- **Precio orientativo:** ~5.000 €/año (licencia corporativa)
- **Modelo de negocio:** Pay-per-use para cartografía + versión corporativa (Xirio Corp)

## Relevancia para el TFG
Xirio Online es la principal referencia comercial en España para planificación radioeléctrica profesional. Está ampliamente utilizado por operadores de telecomunicaciones, administraciones públicas (CNMC, Ministerio de Telecomunicaciones) e ingenieros de radiofrecuencia en España. Su inclusión en el TFG sirve para contextualizar el sistema desarrollado respecto al mercado español y para justificar la necesidad de una herramienta de menor coste y más especializada para el caso de uso táctico.

La diferencia más relevante para el TFG es que Xirio Online es una herramienta de uso general para planificación de redes comerciales, mientras que el TFG desarrolla un sistema específicamente orientado al despliegue táctico rápido con integración en un gemelo digital. El precio (~5.000 €/año) también es una barrera de entrada significativa para usuarios ocasionales o aplicaciones tácticas militares donde la herramienta debe estar disponible sin dependencias de licencias externas.

En la tabla comparativa de la Sección 5.4, Xirio Online representa el extremo "alta funcionalidad, alto coste, sin integración táctico/DT", frente al TFG que apunta a "funcionalidad específica, bajo coste, integración con gemelo digital táctico".

## Conceptos clave
- **Planificación radioeléctrica profesional:** Análisis de cobertura para redes comerciales (LTE, 5G, DVB, PMR, radar)
- **Alta resolución cartográfica:** Utiliza cartografía de alta resolución tanto para entornos urbanos como rurales, a nivel mundial
- **Modelos de propagación:** Longley-Rice, COST-231, Okumura-Hata, modelos específicos para diferentes servicios (difusión, punto-a-punto, móvil)
- **Simulación de interferencias:** Análisis de compatibilidad electromagnética entre sistemas; cálculo de zonas de interferencia
- **Xirio Corp:** Versión corporativa con acceso personalizado y soporte técnico; integración con sistemas de gestión de operadores
- **Regulación española:** Herramienta validada por la Secretaría de Estado de Telecomunicaciones para estudios de cobertura oficiales
- **Modelo pay-per-use:** Los cálculos de cartografía tienen un coste asociado; el usuario selecciona el área y se le cobra según resolución y extensión
- **Formatos de salida:** Mapas de cobertura georreferenciados, informes PDF, exportación KMZ/KML

## Cómo usar en la memoria
- **Sección:** 5.4 — Tabla comparativa de herramientas de planificación RF
- **Propósito:** Referencia del mercado español. Usar para contrastar el coste y funcionalidades con el sistema del TFG. Destacar que Xirio Online no está diseñado para integración táctico-militar ni para uso dentro de un gemelo digital.

## Notas de lectura
> Página web recuperada exitosamente.
> Xirio Online destaca la rapidez y el precio competitivo respecto a herramientas de escritorio.
> La versión gratuita con ejemplos puede usarse para comparación qualitativa.
>
> Para la tabla comparativa del TFG, evaluar:
> - Coste: ~5.000 €/año vs TFG (libre, MATLAB con licencia universitaria)
> - Modelos: Varios modelos vs ITM específico
> - Integración DT: No vs Sí (TFG)
> - Uso offline: No (requiere conexión) vs Sí (TFG)
> - Especialización táctica: No vs Sí (TFG)

## Cita BibTeX
```bibtex
@misc{XirioOnline,
  author       = {{Xirio Online}},
  title        = {{Xirio Online}: Herramienta Comercial de Planificación Radioeléctrica},
  year         = {2024},
  howpublished = {\url{https://www.xirio-online.com}},
  note         = {Plataforma web comercial de planificación radioeléctrica profesional. Utilizada por operadores e instituciones en España. Precio orientativo: 5.000 EUR/año.}
}
```
