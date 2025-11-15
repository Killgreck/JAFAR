#!/bin/bash

# Script para generar un guion narrado del historial de commits del proyecto.

# Asegurarse de que la carpeta Docs exista
mkdir -p Docs

# Generar el archivo Guion.md
echo "# Guion de Desarrollo del Proyecto" > Docs/Guion.md
echo "" >> Docs/Guion.md

# Usar git log para formatear el historial de commits y añadirlo al archivo
git log --pretty=format:"## %s%n*Fecha: %ad*%n*Autor: %an*%n*Commit: %h*%n%n%b%n---%n" --date=short >> Docs/Guion.md

echo "El archivo Guion.md ha sido generado exitosamente en la carpeta Docs."
