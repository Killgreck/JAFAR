Integrar Vitest y pruebas de humo

Añadir las dependencias vitest, supertest y los tipos necesarios.
Crear el archivo de configuración (por ejemplo vitest.config.ts) con soporte para TypeScript y entorno de pruebas.
Actualizar el script "test" en package.json para ejecutar Vitest.
Implementar en tests/health.test.ts un test que levante la app con createApp y valide el endpoint /api/health usando supertest.
(Opcional) Configurar un hook para cerrar la conexión de Mongoose al terminar las pruebas, usando variables de entorno específicas para test.
Plan de servicios en Docker Compose

Servicio app:
Build desde el Dockerfile (fase multietapa).
Variables de entorno (APP_ENV, PORT, MONGODB_URI apuntando al servicio mongo).
Puertos mapeados 4000:4000.
Dependencia depends_on: [mongo].
Servicio mongo:
Imagen oficial mongo:7 (o estable).
Variables básicas (MONGO_INITDB_DATABASE=jafar).
Volumen persistente para /data/db si se desea conservar datos.
Puerto expuesto 27017:27017 para acceder desde la máquina anfitriona.
(Opcional) Servicio mongo-seed si se quisiera precargar datos, aunque para MVP se puede omitir.
Agregar red interna por defecto o explícita para que app y mongo se descubran.
Fase de build en el Dockerfile

Stage builder:
Base node:20-alpine.
Copiar package.json y package-lock.json (si existe).
Ejecutar npm install.
Copiar tsconfig.json y src/.
Ejecutar npm run build para generar dist/.
Stage runner:
Base node:20-alpine.
Establecer NODE_ENV=production.
Copiar únicamente package.json y package-lock.json, ejecutar npm install --omit=dev.
Copiar dist/ desde el builder.
Definir PORT por defecto (p. ej. 4000) y exponerlo.
CMD ["node", "dist/index.js"].
Comandos previstos:
docker build -t jafar-back .
docker compose up (que usará la imagen recién construida).
Actualización de la documentación

Añadir una sección “Pruebas” explicando cómo correr npm test y qué espera producir (Vitest).
Incluir instrucciones paso a paso para levantar el entorno con Docker Compose (docker compose up --build, etc.).
Documentar las variables de entorno necesarias (APP_ENV, PORT, MONGODB_URI) y dónde se configuran (archivo .env, compose, etc.).
Explicar brevemente cómo acceder al endpoint de salud y a cualquier otro endpoint básico después de levantar el stack.