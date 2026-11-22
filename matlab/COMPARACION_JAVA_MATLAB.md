# Comparacion reproducible Java-MATLAB

Este procedimiento no usa mediciones de campo ni demuestra exactitud frente a
ellas. La magnitud calculada es un **proxy de potencia por elemento**, no
SS-RSRP normativo: no se modelan las senales de referencia ni su asignacion.
No se ejecutan los generadores existentes ni se escribe en `matlab/output`.
Las entradas se leen sin modificarlas y las salidas temporales se guardan fuera
del repositorio. Maven crea `backend/target` en este worktree aislado.

## Control homogeneo sintetico

`control_java_matlab.m` implementa de manera independiente el mismo calculo
FSPL + Deygout de Java: distancia horizontal haversine con radio 6.371.000 m,
perfil con paso maximo 30 m, curvatura con radio efectivo 4/3 y difraccion
filo de cuchillo. Son perfiles sinteticos, plano y cresta triangular de 60 m,
ambos con Tx y Rx a 30 m sobre el terreno, separados exactamente 1 km.
Frecuencia 3,5 GHz; potencia 40 dBm, ganancia 15 dBi, cable 2 dB:
EIRP 53 dBm. Ambos restan `10 log10(66*12)` = 28,987251816 dB y
aplican el mismo recorte [-140, -40] dBm.

El valor analitico del perfil plano es FSPL 103,329144109 dB y proxy
−79,316395925 dBm. El perfil con cresta produce 32,101706502 dB de
difraccion y proxy −111,418102426 dBm. En R2025b y Java 17 se
compararon ambos valores con tolerancia 1e-8 dB. Es una regresion de dos
implementaciones del mismo algoritmo, no una comparacion independiente con
Longley-Rice ni validacion de la propagacion real.

Desde la raiz, en PowerShell, con un directorio temporal propio existente:

```powershell
$tmp = 'C:\ruta\temporal\aislada'
matlab -batch "addpath('matlab'); control_java_matlab('$tmp\control.json')"
mvn -B -f backend\pom.xml '-Dtest=SyntheticMatlabComparisonTest' "-Dmatlab.synthetic.result=$tmp\control.json" test
```

Sin `matlab.synthetic.result`, el test Java comprueba el caso analitico y que
la cresta reduce la potencia, pero **no** afirma haber ejecutado MATLAB.
El fichero JSON del control solo contiene cifras sinteticas agregadas.

## Escenarios historicos: comparacion descriptiva

La prueba optativa toma un directorio de JSON de solo lectura y una tesela
GeoTIFF local de solo lectura. Se requieren exactamente los tres escenarios
Longley-Rice conocidos; duplicados, parametros ausentes o raster inexistente
producen error. Java evalua las coordenadas exportadas por MATLAB directamente,
sin emparejar por indices ni regenerar una cuadricula. No se imprimen
coordenadas individuales.

```powershell
$escenarios = 'C:\ruta\escenarios'
$raster = 'C:\ruta\tesela.tif'
mvn -B -f backend\pom.xml '-Dtest=MatlabScenarioComparisonTest' '-Dmatlab.comparison=true' "-Dmatlab.scenarios=$escenarios" "-Dmatlab.raster=$raster" test
```

Los contadores distinguen rejilla historica esperada (80², 60² y 50²,
respectivamente), exportados, ausentes de la exportacion, rutas sin cobertura
del raster Java, valores censurados por recorte y pares evaluables. Un valor
Java bajo −130 dBm se cuenta aunque no apareceria en la exportacion Java;
estos puntos no se excluyen del sesgo si no estan recortados. La suma de
ausentes y exclusiones no prueba su causa individual: no se dispone de las
salidas MATLAB sin filtrar. Se excluyen del sesgo/RMSE los valores recortados,
ya que su magnitud original es desconocida.

Las referencias declaran Longley-Rice y `SRTM_90m_global`; Java usa
FSPL+Deygout y el raster local. No son el mismo modelo ni el mismo terreno.
El codigo del generador muestra que `sigstrength` recibe la potencia Tx y una
antena predeterminada, sin aplicar explicitamente ganancia ni perdidas de
cable; el JSON historico no permite demostrar todos los ajustes de antena ni
la configuracion de aquella ejecucion. Java utiliza potencia + ganancia − 2 dB.
El generador indica ademas un factor historico de 52×12 para 700 MHz y
66×12 para 3,5 GHz, mientras Java usa siempre 66×12. El informe muestra el
resultado crudo y, solo como analisis de sensibilidad, un ajuste hipotetico
del balance y recurso: ganancia − 2 + 10 log10(RB historicos/66). El ajuste
se aplica solo a pares no recortados: **no convierte el resultado historico
en una validacion homogenea del terreno**, no recupera los valores censurados,
y no garantiza que las antenas o la geometria tridimensional coincidan.

### Ejecucion local de referencia

R2025b, Java 17 y Maven; JSON de referencia del repositorio y tesela
PixelIsPoint local con SHA-256
`E13C7F4E7692A2A97092A87219A41DA6BCCA7CF6ECC47A35DAEB58F527281762`.
El sesgo es Java − MATLAB en dB; las metricas se calculan solo sobre pares
no recortados. Las cifras son simulaciones, no medidas.

| Escenario | Esperados | Exportados | Ausentes | Sin terreno Java | Recorte Java | Pares | Java bajo −130 | Sesgo crudo | RMSE crudo | Sesgo ajustado* | RMSE ajustado* |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Madrid | 2500 | 2451 | 49 | 0 | 91 | 2360 | 207 | −2,819 | 15,336 | −15,819 | 21,852 |
| Sierra | 6400 | 4851 | 1549 | 1683 | 49 | 3119 | 88 | +12,774 | 19,833 | −2,191 | 15,328 |
| URJC | 3600 | 3598 | 2 | 0 | 7 | 3591 | 31 | +7,934 | 12,186 | −5,066 | 10,545 |

En esta ejecucion el recorte MATLAB en los puntos con cobertura Java es cero.
El contador Java bajo −130 se solapa con pares y recortes; no se suma a las
exclusiones. *Ajuste hipotetico, no validacion de terreno.* La tesela no cubre
1683 trayectorias exportadas de Sierra; ademas faltan 1549 de sus 6400
coordenadas historicas, por lo que tampoco se representa toda la rejilla.
La incertidumbre de procedencia, el filtrado y las diferencias de modelos
impiden atribuir los residuos al terreno o extrapolarlos a mediciones reales.
