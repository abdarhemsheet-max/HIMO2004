$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
try { $Host.UI.RawUI.WindowTitle = 'نظام حياتي — عبدالرحيم أحمد شيتة' } catch {}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Info($msg)  { Write-Host $msg -ForegroundColor Cyan }
function Ok($msg)    { Write-Host $msg -ForegroundColor Green }
function Warn($msg)  { Write-Host $msg -ForegroundColor Yellow }
function Fail($msg)  { Write-Host $msg -ForegroundColor Red }

function StopAndExit {
    Write-Host ''
    Read-Host 'اضغط Enter للإغلاق'
    exit 1
}

# الحصول على عنوان الـ IP المحلي
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.*' -or $_.IPAddress -like '10.*' }).IPAddress | Select-Object -First 1

Write-Host ''
Write-Host '============================================' -ForegroundColor DarkCyan
Write-Host '   🌟  نظام حياتي — التشغيل السريع' -ForegroundColor DarkCyan
Write-Host '   (وضع الإنتاج — سرعة قصوى ⚡)' -ForegroundColor DarkCyan
Write-Host '============================================' -ForegroundColor DarkCyan
Write-Host ''

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail '[خطأ] Node.js غير مثبت!'
    StopAndExit
}

if (-not (Test-Path 'node_modules')) {
    Info '[1/4] تثبيت الحزم...'
    npm install
    if ($LASTEXITCODE -ne 0) { Fail '[خطأ] فشل التثبيت'; StopAndExit }
} else { Ok '[1/4] الحزم مثبتة ✓' }

if (-not (Test-Path 'prisma\dev.db')) {
    Info '[2/4] إنشاء قاعدة البيانات...'
    npx prisma db push
    if ($LASTEXITCODE -ne 0) { Fail '[خطأ] فشل إنشاء قاعدة البيانات'; StopAndExit }
} else { Ok '[2/4] قاعدة البيانات جاهزة ✓' }

if (-not (Test-Path '.next\BUILD_ID')) {
    Info '[3/4] بناء نسخة الإنتاج...'
    npm run build
    if ($LASTEXITCODE -ne 0) { Fail '[خطأ] فشل البناء'; StopAndExit }
} else { Ok '[3/4] نسخة الإنتاج جاهزة ✓' }

Write-Host ''
Info "╔══════════════════════════════════════════════════╗"
Info "║   🌟  النظام شغال الآن على:                       ║"
Info "║                                                  ║"
Info "║   📍 محلياً:  http://localhost:4400               ║"
if ($ip) { Info "║   🌐 شبكتك:   http://$($ip):4400                    ║" }
Info "║                                                  ║"
Info "║   ❌ لإيقاف:  Ctrl+C  أو  أغلق النافذة           ║"
Info "╚══════════════════════════════════════════════════╝"
Write-Host ''

Start-Job -ScriptBlock { Start-Sleep -Seconds 2; Start-Process 'http://localhost:4400' } | Out-Null

npx next start -p 4400 -H 0.0.0.0

Read-Host 'اضغط Enter للإغلاق'
