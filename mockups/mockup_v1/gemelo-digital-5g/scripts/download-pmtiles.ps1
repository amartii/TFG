# Descarga un fichero .pmtiles para uso offline.
#
# Uso:
#   cd mockups/mockup_v1/gemelo-digital-5g
#   pwsh ./scripts/download-pmtiles.ps1
#
# Resultado:
#   src/assets/tiles/spain.pmtiles  (~25-50 MB para España)
#
# Para regenerar un extract personalizado: usa la CLI de Protomaps
# (https://docs.protomaps.com/pmtiles/cli) sobre el OSM-PBF de Geofabrik:
#   pmtiles extract https://build.protomaps.com/<DATE>.pmtiles spain.pmtiles \
#       --bbox=-9.5,35.9,4.4,43.8

param(
    [switch]$Force  # Salta la confirmación interactiva al usar el demo público
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AssetsDir = Join-Path $ProjectRoot 'src\assets\tiles'
$Target = Join-Path $AssetsDir 'spain.pmtiles'

# Bbox aproximada de la Península Ibérica + Baleares + Canarias.
$Bbox = '-18.5,27.5,4.4,44.0'

# Fichero diario más reciente (Protomaps publica un build mundial cada día).
# Si esta URL deja de funcionar, ver https://maps.protomaps.com/builds/
$Source = 'https://build.protomaps.com/20250901.pmtiles'

if (!(Test-Path $AssetsDir)) {
    New-Item -ItemType Directory -Path $AssetsDir -Force | Out-Null
}

if (Test-Path $Target) {
    $size = (Get-Item $Target).Length / 1MB
    Write-Host "[OK] Ya existe $Target ($([math]::Round($size,1)) MB)" -ForegroundColor Green
    Write-Host "Para forzar descarga: borra el fichero y vuelve a ejecutar."
    exit 0
}

Write-Host "Descargando extract España desde $Source"
Write-Host "Bbox: $Bbox"
Write-Host "Destino: $Target`n"

# Comprobamos si existe la CLI 'pmtiles' (recomendado: extract más pequeño).
$pmtilesCli = Get-Command pmtiles -ErrorAction SilentlyContinue
if ($pmtilesCli) {
    Write-Host "[INFO] Usando CLI pmtiles para extract optimizado"
    & pmtiles extract $Source $Target --bbox=$Bbox
    Write-Host "[OK] Descarga completa: $Target" -ForegroundColor Green
    exit 0
}

Write-Host "[INFO] CLI 'pmtiles' no encontrada. Para un extract optimizado de España"
Write-Host "       (~25-50 MB) instálala desde:"
Write-Host "       https://github.com/protomaps/go-pmtiles/releases`n"
Write-Host "ALTERNATIVA: descargar el v4.pmtiles MUNDIAL completo de Protomaps."
Write-Host "ATENCIÓN: este fichero supera 1 GB. Solo recomendado si necesitas"
Write-Host "          cobertura mundial sin cuenta CLI:"

$demoUrl = 'https://demo-bucket.protomaps.com/v4.pmtiles'
Write-Host "       $demoUrl`n"
if (-not $Force) {
    $reply = Read-Host "Descargar el demo? (s/N)"
    if ($reply -ne 's' -and $reply -ne 'S') {
        Write-Host "Cancelado. Sin fichero local, el frontend usará el CDN remoto."
        exit 0
    }
} else {
    Write-Host "[Force] Descargando sin pedir confirmación..."
}

Write-Host "Descargando demo..."
Invoke-WebRequest -Uri $demoUrl -OutFile $Target -UseBasicParsing
$size = (Get-Item $Target).Length / 1MB
Write-Host "[OK] Demo descargado: $Target ($([math]::Round($size,1)) MB)" -ForegroundColor Green
