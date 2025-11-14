#!/bin/bash

# Script para sincronizar el servidor Ubuntu con el repositorio
# Ejecuta esto en tu servidor: bash sync-server.sh

set -e

echo "🔄 Iniciando sincronización forzada..."

# Detener procesos en segundo plano si existen
echo "⏹️  Deteniendo servicios..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

sleep 2

# Ir al directorio del proyecto
cd /home/ubuntu/JAFAR || { echo "❌ Error: directorio /home/ubuntu/JAFAR no existe"; exit 1; }

echo "📦 Guardando cambios locales (si existen)..."
git stash push -m "Backup antes de sincronización $(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

echo "🌐 Obteniendo última versión del repositorio..."
git fetch origin --prune

echo "🔀 Cambiando a la rama correcta..."
git checkout claude/user-profile-management-01TetrgaqQKvna14CSPqCqQt

echo "🔨 Sincronización forzada con repositorio remoto..."
git reset --hard origin/claude/user-profile-management-01TetrgaqQKvna14CSPqCqQt

echo "🧹 Limpiando archivos no rastreados..."
git clean -fd

echo "📊 Estado actual:"
git log --oneline -3

echo ""
echo "✅ Sincronización completada!"
echo ""
echo "📦 Ahora ejecuta estos comandos para iniciar los servicios:"
echo ""
echo "# Terminal 1 (Backend):"
echo "cd /home/ubuntu/JAFAR/Back"
echo "npm install  # Solo si es necesario"
echo "npm run dev"
echo ""
echo "# Terminal 2 (Frontend):"
echo "cd /home/ubuntu/JAFAR/Front"
echo "npm install  # Solo si es necesario"
echo "npm run dev"
