# Análisis Comparativo de Modelos de Propagación
## FSPL vs COST-231 Hata vs Longley-Rice ITM

**Escenario:** URJC Fuenlabrada — Campus Rectorado
**Emplazamiento Tx:** 40.2897°N, 3.8244°W | Altura: 30 m | Potencia: 40 dBm | Ganancia: 15 dBi
**EIRP:** 53.0 dBm | **Frecuencia:** 3.5 GHz (banda n78 FR1)
**Área:** 3×3 km | **Cuadrícula:** 60×60 = 3.600 puntos | **Espaciado:** 50 m
**Datos de elevación:** SRTM 1 Arc-Second (~30 m) — Tile N40W004
**Rango de elevación del área:** 654–702 m s.n.m.

---

## Resultados por modelo

| Métrica | FSPL | COST-231 Hata | **Longley-Rice ITM** |
|---|---|---|---|
| Prx máxima | -21.4 dBm | -45.1 dBm | **-34.5 dBm** |
| Prx mínima | -56.9 dBm | -107.5 dBm | **-102.2 dBm** |
| RSRP medio | — | -125.8 dBm | **-93.9 dBm** |
| Puntos exportados | — | 2.348 / 3.600 | **3.598 / 3.600** |
| JSON generado | — | 2f6070cf…json | **b83baf94…json** |

### Distribución de cobertura

| Zona | Umbral | COST-231 Hata | **Longley-Rice** |
|---|---|---|---|
| Excelente | ≥ −80 dBm | 0.1% | **2.1%** |
| Buena | −90 a −80 dBm | 0.2% | **17.8%** |
| Aceptable | −100 a −90 dBm | 1.1% | **73.5%** |
| Débil | −110 a −100 dBm | 3.3% | **2.8%** |
| Sin cobertura | < −110 dBm | **95.2%** | 3.8% |

---

## Interpretación física

### FSPL — Free Space Path Loss (cota superior teórica)

Modelo de referencia que asume espacio libre sin obstáculos. No tiene en
cuenta terreno, difracción, ni efectos atmosféricos. Representa el límite
optimista absoluto: ningún entorno real puede superar esta señal.

- Prx máxima de −21.4 dBm: físicamente irreal para cualquier despliegue
  real, pero útil como referencia de sanidad del resto de modelos.
- Diferencia con Longley-Rice: ~13 dB en zona cercana, hasta ~45 dB en
  bordes. Esta diferencia creciente con la distancia es la firma del terreno.

### COST-231 Hata (fallback sin Communications Toolbox)

Modelo empírico derivado de mediciones en entornos urbanos europeos.
**Rango de validez estricto: 1.500–2.000 MHz.** A 3.5 GHz introduce un
error sistemático de +15 a +20 dB (pérdidas excesivas), lo que explica el
resultado catastrófico: 95.2% del área sin cobertura.

> Conclusión: COST-231 Hata es inutilizable a 3.5 GHz para este TFG.
> Solo se mantiene como fallback de emergencia si el Communications Toolbox
> no está disponible, con advertencia explícita en la memoria.

### Longley-Rice ITM (modelo objetivo del TFG)

Modelo semi-empírico desarrollado por Longley & Rice (1968) para propagación
sobre terreno irregular. Implementado en MATLAB via `propagationModel('longley-rice')`
del Communications Toolbox (R2019b+). Validado por la NTIA/ITS para bandas
de 20 MHz a 20 GHz, entornos suburbanos y rurales.

**Por qué los resultados son coherentes:**

- **RSRP medio de −93.9 dBm** — centro del rango "Aceptable", típico de
  una macrocelda 5G en suburbano a distancias de 0–1.5 km con antena a 30 m.
- **73.5% en zona "Aceptable"** — distribución característica de los bordes
  de cobertura de una celda sectorial en terreno suave.
- **3.8% sin cobertura** — coherente con zonas bloqueadas por el relieve
  (diferencia de 48 m entre el punto más bajo y más alto del tile SRTM).
- **Diferencia FSPL vs LR en bordes (~45 dB)** — el modelo ITM incorpora
  difracción sobre los cambios de pendiente del terreno, que FSPL ignora.

**Validación teórica a d = 1 km (espacio libre):**

```
FSPL(1 km, 3.5 GHz) = 103.3 dB
Prx = EIRP + Grx - FSPL = 53.0 + 0 - 103.3 = -50.3 dBm
RSRP = Prx - 10·log10(66·12) ≈ -50.3 - 29.0 = -79.3 dBm  → Excelente
```

El valor −79.3 dBm a 1 km en espacio libre es la cota superior. En la
simulación real con terreno, los puntos a ~1 km muestran valores en torno
a −85 a −95 dBm, lo que implica unas pérdidas adicionales de terreno de
6–16 dB — rango totalmente esperado para entorno suburbano con SRTM 30 m.

---

## Decisión de modelo para el TFG

| Criterio | FSPL | COST-231 Hata | **Longley-Rice** |
|---|---|---|---|
| Validez a 3.5 GHz | Sí (teórico) | No (±15 dB error) | **Sí** |
| Incorpora terreno | No | No | **Sí** |
| Coherencia con 3GPP TR 38.901 | Referencia | Parcial | **Alta** |
| Disponibilidad MATLAB | Siempre | Siempre | Requiere Comm. Toolbox |
| Uso en el TFG | Validación | Fallback emergencia | **Modelo principal** |

**Modelo seleccionado: Longley-Rice ITM** (`propagationModel('longley-rice')`,
MATLAB Communications Toolbox R2025b). Fallback automático a COST-231 Hata
con advertencia si el toolbox no está disponible.

---

## Historial de ejecuciones

| Fecha | Modelo | UUID JSON | RSRP medio | Cobertura ≥ −100 dBm |
|---|---|---|---|---|
| 2026-04-10 | COST-231 Hata | `2f6070cf-d8d1-42de-8516-5cbbbbbfd6e0` | −125.8 dBm | 1.4% |
| 2026-04-10 | **Longley-Rice** | `b83baf94-8db6-4512-a34b-b831e3f6267a` | **−93.9 dBm** | **93.4%** |

---

*Generado el 10 de abril de 2026 — TFG Gemelo Digital 5G, Álvaro Martínez Téllez, URJC 2025-2026*
