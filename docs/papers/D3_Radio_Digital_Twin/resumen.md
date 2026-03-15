# AIRMap: AI-Generated Radio Maps for Wireless Digital Twins

## Datos bibliográficos
- **Autores:** Saeizadeh, Ali; Tehrani-Moayyed, Miead; Villa, Davide; Beattie Jr., J. Gordon; Johari, Pedram; Basagni, Stefano; Melodia, Tommaso
- **Año:** 2025 (arXiv octubre 2025; revisado marzo 2026)
- **Publicación:** arXiv preprint (Northeastern University / VIAVI Solutions / NTIA PWSCIF)
- **arXiv:** https://arxiv.org/abs/2511.05522
- **PDF directo:** https://arxiv.org/pdf/2511.05522

## Estado de descarga

**PDF descargado correctamente** — `Radio_Digital_Twin.pdf` (24 MB)

Fuente: arXiv PDF descargado directamente via curl desde https://arxiv.org/pdf/2511.05522

## Cambio respecto al placeholder original
El placeholder buscaba un paper sobre Radio Environment Map y Digital Twin para gestión espectral. Se encontró este paper de vanguardia que presenta AIRMap, un sistema de generación de mapas de radio mediante deep learning para Digital Twins inalámbricos: genera predicciones de path gain en < 4 ms (100× más rápido que ray tracing) con < 4 dB RMSE al calibrar con mediciones de campo.

## Relevancia para el TFG
Este paper es el que más directamente conecta con el enfoque técnico del TFG: une el concepto de Digital Twin con la planificación de cobertura RF y la gestión del espectro. El Radio Environment Map (REM) es un mapa 2D/3D de las condiciones radioeléctricasen un área geográfica — en esencia, lo que produce el motor MATLAB del TFG.

El Radio Digital Twin extiende el REM al concepto de DT: no solo describe el campo electromagnético actual, sino que lo predice, lo actualiza con mediciones en tiempo real, y lo usa para tomar decisiones de gestión espectral. Para el TFG, esto sitúa el sistema desarrollado como una implementación del REM, la capa base del Radio DT, con potencial de evolución hacia un sistema más completo.

Para la Sección 2.6, este paper proporciona el marco teórico que une el mapa de cobertura con la inteligencia operacional: el REM/Radio DT puede usarse para detectar interferencias, optimizar el uso del espectro, planificar handovers, y predecir zonas de sombra antes del despliegue físico — exactamente la motivación del TFG para un operador táctico.

## Conceptos clave
- **Radio Environment Map (REM):** Base de datos geoespacial del entorno radioeléctrico; incluye niveles de señal, interferencia, ocupación espectral, y parámetros del canal
- **Radio Digital Twin:** DT especializado en el entorno radioeléctrico; combina modelos de propagación física con datos de medición
- **Spectrum Sensing:** Medición activa del entorno radioeléctrico por los terminales para alimentar el REM con datos reales
- **Crowdsourcing de medidas:** Uso de mediciones distribuidas de múltiples UEs para actualizar el REM en tiempo real (MDT: Minimization of Drive Tests en 3GPP)
- **Interpolación espacial:** Técnicas para inferir el campo EM en puntos no medidos (kriging, machine learning); permiten rellenar el mapa con mediciones esparsas
- **REM para gestión cognitiva:** El REM como base para radio cognitiva (Cognitive Radio) y gestión dinámica del espectro
- **Fusión de modelos:** Combinación de predicciones físicas (Longley-Rice, ray tracing) con mediciones para mejorar la precisión del mapa
- **MDT (Minimization of Drive Tests):** Mecanismo 3GPP para recopilar medidas de los UEs (RSRP, RSRQ) para actualizar los modelos de red

## Cómo usar en la memoria
- **Sección:** 2.5 — Digital Twin y mapa de entorno radioeléctrico
- **Sección:** 2.6 — Radio Environment Map como base del gemelo digital táctico
- **Propósito:** Conectar el mapa de cobertura del TFG con el concepto de REM y Radio DT. Justificar la evolución futura del sistema hacia un DT completo con actualización en tiempo real.

## Resumen del paper

AIRMap es un sistema de deep learning (U-Net autoencoder) que genera mapas de radio para Digital Twins inalámbricos usando solo mapas de elevación 2D del terreno y edificios. Entrenado con 1.2 millones de muestras del área de Boston y validado en cuatro entornos distintos (urbano y rural), logra < 4 dB RMSE en 4 ms por inferencia en GPU NVIDIA L40S — más de 100 veces más rápido que ray tracing acelerado por GPU. Con calibración de mediciones de campo limitadas, reduce el error al ~5%. El sistema es relevante para el TFG como tecnología de generación de mapas de cobertura en tiempo real para Digital Twins de red.

## Notas de lectura
> PDF descargado (24 MB). Leer las secciones de arquitectura del modelo y resultados de validación.
> Comparar la precisión (< 4 dB RMSE) con la del modelo ITM del TFG.
> Anotar el pipeline de calibración con mediciones de campo para usar en la discusión de trabajo futuro.

## Cita BibTeX
```bibtex
@misc{Saeizadeh2025_AIRMap,
  author    = {Saeizadeh, Ali and Tehrani-Moayyed, Miead and Villa, Davide and Beattie Jr., J. Gordon and Johari, Pedram and Basagni, Stefano and Melodia, Tommaso},
  title     = {{AIRMap}: {AI}-Generated Radio Maps for Wireless Digital Twins},
  year      = {2025},
  url       = {https://arxiv.org/abs/2511.05522},
  note      = {arXiv:2511.05522. Deep learning para generación ultrarrápida de mapas de radio en Digital Twins inalámbricos. < 4 dB RMSE, 100× más rápido que ray tracing.}
}
```
