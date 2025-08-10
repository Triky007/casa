#!/bin/bash

# Script de despliegue para family.triky.app
# Ejecutar como root o con sudo

set -e

echo "🚀 Iniciando despliegue de Family Tasks App..."

# Variables
DOMAIN_FRONTEND="family.triky.app"
DOMAIN_API="api.family.triky.app"
APP_DIR="/var/www/family-tasks"
APACHE_SITES="/etc/apache2/sites-available"

# 1. Actualizar sistema
echo "📦 Actualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependencias
echo "🔧 Instalando dependencias..."
apt install -y apache2 docker.io docker-compose certbot python3-certbot-apache curl

# 3. Habilitar módulos de Apache
echo "⚙️ Configurando Apache..."
a2enmod ssl
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod headers
a2enmod rewrite

# 4. Crear directorio de la aplicación
echo "📁 Preparando directorio..."
mkdir -p $APP_DIR
cd $APP_DIR

# 5. Clonar/copiar código (ajusta según tu método)
echo "📥 Copiando código..."
# Si tienes el código en Git:
# git clone https://github.com/tu-usuario/family-tasks.git .
# O copiar desde donde tengas el código

# 6. Configurar Apache
echo "🌐 Configurando Apache..."
cp apache-config/family-triky-app.conf $APACHE_SITES/
a2ensite family-triky-app.conf

# 7. Obtener certificados SSL
echo "🔒 Obteniendo certificados SSL..."
certbot --apache -d $DOMAIN_FRONTEND -d $DOMAIN_API --non-interactive --agree-tos --email tu-email@dominio.com

# 8. Construir y levantar Docker
echo "🐳 Construyendo contenedores..."
docker-compose build --no-cache
docker-compose up -d

# 9. Verificar que los servicios estén corriendo
echo "✅ Verificando servicios..."
sleep 10
docker-compose ps

# 10. Reiniciar Apache
echo "🔄 Reiniciando Apache..."
systemctl restart apache2
systemctl enable apache2

# 11. Configurar firewall (opcional)
echo "🛡️ Configurando firewall..."
ufw allow 'Apache Full'
ufw allow ssh
# ufw --force enable

echo "🎉 ¡Despliegue completado!"
echo ""
echo "URLs de acceso:"
echo "Frontend: https://$DOMAIN_FRONTEND"
echo "API: https://$DOMAIN_API"
echo "API Docs: https://$DOMAIN_API/docs"
echo ""
echo "Para ver logs:"
echo "docker-compose logs -f"
echo "tail -f /var/log/apache2/family.triky.app_error.log"
