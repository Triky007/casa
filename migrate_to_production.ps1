# Script PowerShell para migrar datos a producción
# Uso: .\migrate_to_production.ps1

param(
    [string]$ProductionServer = "api.family.triky.app",
    [string]$ProductionUser = "root"
)

# Configuración
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups"

Write-Host "🚀 MIGRACIÓN A PRODUCCIÓN" -ForegroundColor Blue
Write-Host "=================================="
Write-Host "Servidor destino: $ProductionServer"
Write-Host "Timestamp: $timestamp"
Write-Host ""

# Crear directorio de backups
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
    Write-Host "📁 Directorio de backups creado: $backupDir" -ForegroundColor Green
}

# Verificar contenedores
Write-Host "🐳 Contenedores disponibles:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
Write-Host ""

# Contenedores identificados
$localBackendContainer = "casa-1-backend-1"
$localDbContainer = "casa-1-db-1"

Write-Host "📊 Contenedores identificados:" -ForegroundColor Cyan
Write-Host "  Backend: $localBackendContainer"
Write-Host "  Base de datos: $localDbContainer"
Write-Host ""

try {
    # 1. Backup de base de datos
    Write-Host "⏳ Creando backup de la base de datos..." -ForegroundColor Yellow
    $dbBackupFile = "$backupDir\database_backup_$timestamp.sql"
    
    $dbBackupCmd = "docker exec -t $localDbContainer pg_dump -U family_user -d family_tasks_db"
    Invoke-Expression "$dbBackupCmd > `"$dbBackupFile`""
    
    if (Test-Path $dbBackupFile) {
        $dbSize = (Get-Item $dbBackupFile).Length
        Write-Host "✅ Backup de BD creado: $dbBackupFile ($([math]::Round($dbSize/1KB, 2)) KB)" -ForegroundColor Green
    } else {
        throw "Error creando backup de base de datos"
    }

    # 2. Backup de uploads
    Write-Host "⏳ Creando backup de archivos subidos..." -ForegroundColor Yellow
    $uploadsBackupFile = "$backupDir\uploads_backup_$timestamp.tar.gz"
    
    $uploadsBackupCmd = "docker exec $localBackendContainer tar czf - -C /app uploads/"
    Invoke-Expression "$uploadsBackupCmd > `"$uploadsBackupFile`""
    
    if (Test-Path $uploadsBackupFile) {
        $uploadsSize = (Get-Item $uploadsBackupFile).Length
        Write-Host "✅ Backup de uploads creado: $uploadsBackupFile ($([math]::Round($uploadsSize/1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backup de uploads vacío o no creado (puede ser normal si no hay fotos)" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "📋 RESUMEN DE BACKUPS CREADOS:" -ForegroundColor Cyan
    Write-Host "================================"
    Get-ChildItem $backupDir\*$timestamp* | ForEach-Object {
        $size = [math]::Round($_.Length/1KB, 2)
        Write-Host "  $($_.Name) - $size KB" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "📤 PRÓXIMOS PASOS PARA TRANSFERIR:" -ForegroundColor Yellow
    Write-Host "=================================="
    Write-Host "1. Transferir archivos al servidor de producción:"
    Write-Host "   scp `"$dbBackupFile`" $ProductionUser@${ProductionServer}:/tmp/" -ForegroundColor White
    Write-Host "   scp `"$uploadsBackupFile`" $ProductionUser@${ProductionServer}:/tmp/" -ForegroundColor White
    Write-Host ""
    Write-Host "2. En el servidor de producción, ejecutar:"
    Write-Host "   # Restaurar base de datos" -ForegroundColor White
    Write-Host "   docker exec -i CONTENEDOR_POSTGRES_PROD psql -U family_user -d family_tasks_db < /tmp/database_backup_$timestamp.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "   # Restaurar uploads" -ForegroundColor White
    Write-Host "   docker exec -i CONTENEDOR_BACKEND_PROD tar xzf /tmp/uploads_backup_$timestamp.tar.gz -C /app/" -ForegroundColor White
    Write-Host ""
    Write-Host "   # Reiniciar contenedores" -ForegroundColor White
    Write-Host "   docker restart CONTENEDOR_BACKEND_PROD" -ForegroundColor White

    # Opción para transferir automáticamente (si SCP está disponible)
    Write-Host ""
    $transfer = Read-Host "¿Quieres intentar transferir automáticamente? (s/N)"
    
    if ($transfer -eq "s" -or $transfer -eq "S") {
        Write-Host "⏳ Transfiriendo archivos..." -ForegroundColor Yellow
        
        try {
            & scp $dbBackupFile "${ProductionUser}@${ProductionServer}:/tmp/"
            Write-Host "✅ Base de datos transferida" -ForegroundColor Green
            
            & scp $uploadsBackupFile "${ProductionUser}@${ProductionServer}:/tmp/"
            Write-Host "✅ Uploads transferidos" -ForegroundColor Green
            
            Write-Host ""
            Write-Host "🎉 ¡Archivos transferidos exitosamente!" -ForegroundColor Green
            Write-Host "Ahora conéctate al servidor de producción y ejecuta los comandos de restauración mostrados arriba."
            
        } catch {
            Write-Host "❌ Error en la transferencia: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "💡 Puedes transferir manualmente usando WinSCP, FileZilla o SCP" -ForegroundColor Yellow
        }
    }

} catch {
    Write-Host "❌ Error durante el proceso: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
