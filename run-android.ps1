# ============================================================
# run-android.ps1 — Instala SaaS POS en Pixel 9 Pro
# Ejecutar desde la raiz del monorepo: .\run-android.ps1
# ============================================================

Write-Host ""
Write-Host "=== SaaS POS — Deploy en Android ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar ADB y dispositivo conectado
Write-Host "[1/4] Verificando dispositivo Android..." -ForegroundColor Yellow
$devices = adb devices 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: adb no encontrado. Asegurate de que Android Studio esta instalado y adb esta en el PATH." -ForegroundColor Red
    Write-Host "Ruta tipica: C:\Users\user\AppData\Local\Android\Sdk\platform-tools" -ForegroundColor Gray
    exit 1
}

$connectedDevice = $devices | Select-String -Pattern "device$" | Where-Object { $_ -notmatch "List of" }
if (-not $connectedDevice) {
    Write-Host "ERROR: No se encontro ningun dispositivo. Verifica:" -ForegroundColor Red
    Write-Host "  1. El cable USB esta conectado" -ForegroundColor Gray
    Write-Host "  2. La Depuracion USB esta activada en el Pixel 9 Pro" -ForegroundColor Gray
    Write-Host "  3. Aceptaste la solicitud de depuracion en el celular" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Dispositivos detectados:" -ForegroundColor Yellow
    Write-Host $devices
    exit 1
}
Write-Host "OK — Dispositivo encontrado: $connectedDevice" -ForegroundColor Green

# 2. Instalar dependencias si faltan
Write-Host ""
Write-Host "[2/4] Verificando dependencias del monorepo..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  Instalando dependencias (npm install)..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en npm install" -ForegroundColor Red; exit 1 }
} else {
    Write-Host "OK — node_modules existe" -ForegroundColor Green
}

# 3. Configurar puerto para Metro
Write-Host ""
Write-Host "[3/4] Configurando puerto Metro (adb reverse)..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK — Puerto 8081 redirigido al PC" -ForegroundColor Green
} else {
    Write-Host "AVISO: adb reverse fallo. La app usara la red WiFi en lugar de USB." -ForegroundColor Yellow
}

# 4. Compilar e instalar en el dispositivo
Write-Host ""
Write-Host "[4/4] Compilando e instalando en el Pixel 9 Pro..." -ForegroundColor Yellow
Write-Host "  (Primera vez: ~5-8 minutos. Compilaciones posteriores: ~1-2 minutos)" -ForegroundColor Gray
Write-Host ""

Set-Location "apps\mobile"
npx expo run:android --device

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR en el build. Intentando con clean..." -ForegroundColor Red
    Write-Host "Ejecuta manualmente:" -ForegroundColor Yellow
    Write-Host "  cd apps\mobile" -ForegroundColor Gray
    Write-Host "  npx expo prebuild --clean --platform android" -ForegroundColor Gray
    Write-Host "  npx expo run:android --device" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "=== App instalada y corriendo en tu Pixel 9 Pro ===" -ForegroundColor Green
