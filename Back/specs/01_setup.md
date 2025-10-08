### Backend Básico para “jafar”

Instrucciones: Construye solo la funcionalidad core mínima del backend de “jafar”, manteniendo simplicidad extrema y evitando features adicionales complejas. Dockeriza el proyecto.

1. **Estructura base del proyecto**  
   - Inicializa un proyecto Node.js con Express y TypeScript.  
   - Crea las carpetas `src/` (código fuente), `src/config/`, `src/modules/`, `src/core/` (helpers comunes), y `tests/`.  
   - Dentro de `src/modules/`, prepara subcarpetas para `users`, `bets`, y `wallet`, cada una con archivos para controlador, servicio y rutas.  
   - Incluye un punto de entrada `src/index.ts` que cargue la app, y una capa de servidor `src/server.ts` para aislar la lógica de inicialización.

2. **Dependencias esenciales y scripts**  
   - Instala dependencias: `express`, `dotenv`, `cors`, `mongoose` (o el ODM elegido), y `pino` o similar para logging ligero.  
   - Instala dependencias de desarrollo: `typescript`, `ts-node-dev`, `eslint`, `prettier`, `@types/express`, `@types/node`, `husky` y `lint-staged` (solo si aportan simplicidad al flujo).  
   - Configura `package.json` con scripts `"dev"`, `"build"`, `"start"`, `"lint"`, y `"test"`, asegurando que usen TypeScript y ts-node-dev para recarga en caliente.

3. **Configuraciones de la aplicación**  
   - Crea `tsconfig.json` con compilación dirigida a ES2021 y salida en `dist/`.  
   - Define `.env.example` con variables esenciales (`PORT`, `MONGODB_URI`, `APP_ENV`).  
  - Implementa un módulo `src/config/environment.ts` que cargue variables usando `dotenv`, valide valores críticos y exponga una interfaz tipada.  
   - Configura middlewares base: parsing JSON, CORS, un manejador de errores general y un logger HTTP minimalista.

4. **Conexión a MongoDB Atlas y capa de datos**  
   - Implementa `src/config/database.ts` que exponga una función async para conectar con MongoDB usando la URI del entorno.  
   - Añade lógica para reconexión y manejo de eventos de conexión/desconexión sin complicaciones innecesarias.  
   - Crea modelos iniciales en `src/modules/*/model.ts` utilizando `mongoose.Schema`, asegurando solo los campos imprescindibles para usuarios, apuestas y wallet.

5. **Módulos base y rutas CRUD mínimas**  
   - Para cada módulo (`users`, `bets`, `wallet`), define controladores con operaciones esenciales: listar, crear y obtener detalle.  
   - Implementa servicios que encapsulen la lógica de negocio mínima (validaciones básicas, interacción con el modelo).  
   - Registra las rutas en un router principal `src/app.ts`, bajo prefijos `/api/users`, `/api/bets`, `/api/wallet`.  
   - Añade un middleware sencillo de validación (por ejemplo, usando `zod` o validaciones manuales) para asegurar que las entradas críticas tengan formato esperado.

6. **Pruebas básicas y orquestación con Docker**  
   - Implementa un endpoint de salud (`/api/health`) y agrega pruebas de humo en `tests/health.test.ts` usando una librería ligera como `vitest` o `jest`.  
   - Configura `docker-compose.yml` con servicios para la aplicación (`app`) y una instancia de MongoDB (`mongo`) para desarrollo local.  
   - Redacta un `Dockerfile` multietapa que compile TypeScript y ejecute la app en modo producción, garantizando simplicidad en la imagen.  
   - Documenta en el README los comandos para levantar el entorno (`docker compose up`) y ejecutar pruebas (`npm run test`).