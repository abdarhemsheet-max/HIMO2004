# سكربت ترحيل قاعدة البيانات من SQLite إلى Supabase PostgreSQL
Write-Host '=== ترحيل بيانات نظام حياتي إلى Supabase ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'متطلبات مسبقة:'
Write-Host '1. أنشئ ملف .env.production وضف فيه DATABASE_URL الصحيح'
Write-Host '2. تأكد من اتصال الإنترنت'
Write-Host ''

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# تشغيل Prisma مباشرة على Supabase
Write-Host '[1/2] إنشاء الجداول في Supabase PostgreSQL...' -ForegroundColor Yellow
npx prisma db push --accept-data-loss

if ($LASTEXITCODE -ne 0) {
    Write-Host '[خطأ] فشل إنشاء الجداول. تحقق من DATABASE_URL في .env.production' -ForegroundColor Red
    exit 1
}
Write-Host '[1/2] تم إنشاء الجداول ✓' -ForegroundColor Green

Write-Host '[2/2] توليد عميل Prisma...' -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host '[خطأ] فشل توليد العميل' -ForegroundColor Red
    exit 1
}
Write-Host '[2/2] تم التوليد ✓' -ForegroundColor Green

Write-Host ''
Write-Host '=== الترحيل اكتمل ===' -ForegroundColor Cyan
Write-Host 'شغّل النظام الآن: npm run start'
