### README – Plataforma de Apuestas P2P “jafar”

#### Descripción del Proyecto
“jafar” es una plataforma de apuestas entre pares (P2P) enfocada en ofrecer transparencia, comisiones reducidas (5%) y libertad para crear apuestas personalizadas sobre cualquier evento verificable. El objetivo MVP es alcanzar 5 000 usuarios activos mensuales y un volumen de 100 000 USD en transacciones durante los primeros 8 meses. El enfoque del desarrollo es mantener la simplicidad y asegurar que solo se construya la funcionalidad core necesaria para operar el modelo P2P sin añadir características complejas adicionales.

#### Stack Tecnológico

- **Backend**
  - **Lenguaje/Framework:** Node.js + Express.js con TypeScript
  - **Motivación:** Soporta I/O en tiempo real para el motor de matching y WebSockets, y TypeScript aporta tipado fuerte para la lógica financiera.

- **Frontend Web**
  - **Framework:** React con TypeScript
  - **Motivación:** Permite dashboards en tiempo real y reutiliza tipados compartidos con el backend manteniendo una base de código consistente y enfocada en la funcionalidad esencial.

- **Frontend Mobile**
  - **Framework:** React Native con Expo y TypeScript
  - **Motivación:** Mantiene un único stack TypeScript para acelerar el desarrollo de una app móvil básica que ofrezca las funciones core (creación/aceptación de apuestas y gestión de wallet) sin incorporar módulos complejos.

- **Base de Datos**
  - **Principal:** MongoDB Atlas (NoSQL) para modelar apuestas flexibles y escalar automáticamente.
  - **Secundaria/Respaldo:** MySQL para redundancia y registros transaccionales críticos.

#### Arquitectura de Software
- **Patrón:** Microservicios orquestados mediante un API Gateway.
- **Servicios Core:** Autenticación y usuarios, motor de creación/matching de apuestas, gestión de eventos, wallet y pagos, verificación y resolución.
- **Razones:** 
  - Escalabilidad independiente de componentes críticos.
  - Aislamiento de fallos y control regulatorio por dominio.
  - Mantiene la simplicidad al limitar el número de servicios al mínimo necesario para el MVP, evitando feature creep.

#### Entidades del Sistema

- **Usuario**
  - `id`
  - `nombre`
  - `email`
  - `documentoIdentidad`
  - `paisResidencia`
  - `estadoVerificacion`
  - `fechaRegistro`

- **Wallet**
  - `id`
  - `usuarioId`
  - `saldoDisponible`
  - `saldoBloqueado`
  - `monedaPrincipal`
  - `metodosPagoVinculados`

- **Transaccion**
  - `id`
  - `walletId`
  - `tipo` (depósito, retiro, comisión, payout)
  - `monto`
  - `moneda`
  - `referenciaPasarela`
  - `estado`
  - `fecha`

- **Evento**
  - `id`
  - `nombre`
  - `categoria`
  - `fuenteVerificacion`
  - `fechaInicio`
  - `fechaCierreApuestas`
  - `estado`

- **Apuesta**
  - `id`
  - `creadorId`
  - `eventoId`
  - `descripcion`
  - `cuotaOfertada`
  - `montoMinimo`
  - `montoMaximo`
  - `estado` (abierta, emparejada, cerrada, cancelada)
  - `fechaCreacion`

- **MatchApuesta**
  - `id`
  - `apuestaId`
  - `apostadorContraparteId`
  - `montoAceptado`
  - `cuotaFinal`
  - `estadoResolucion`
  - `resultado`

- **Resolucion**
  - `id`
  - `matchApuestaId`
  - `resultadoVerificado`
  - `fuente`
  - `fechaResolucion`
  - `disputa` (booleano)
  - `observaciones`

#### Enfoque de Simplicidad
El roadmap y la ejecución técnica priorizan únicamente los componentes necesarios para habilitar el flujo P2P: creación de apuestas, matching automático, wallet con transacciones seguras y resolución fiable. Se pospone cualquier funcionalidad secundaria (gamificación, modo práctica, etc.) hasta que la plataforma alcance estabilidad y métricas clave, manteniendo así un producto claro, funcional y fácil de mantener.

#### Pruebas

Para ejecutar las pruebas de humo se utiliza Vitest junto con Supertest:

- Instala las dependencias: `npm install`
- Ejecuta las pruebas: `npm run test`

El test incluido valida el endpoint `/api/health` para confirmar que el backend responde correctamente y que la configuración mínima está funcionando.

#### Docker y Orquestación

Para desarrollo local se proporcionan:

- `docker-compose.yml`: levanta `api`, `mongo` con credenciales y `redis`.
- `.env.docker`: plantilla con variables para este entorno.

Pasos rápidos:
1. Copia `.env.docker` a `.env.docker.local` y ajusta las contraseñas.
2. Ejecuta `docker compose --env-file .env.docker.local up --build`.
3. La API queda disponible en `http://localhost:${APP_PUBLIC_PORT:-4000}`.

Para despliegues de alta seguridad en AWS EC2 revisa `deploy/README.md`, que incluye `docker-compose.core.yml` (microservicios) y `docker-compose.data.yml` (capa de datos + replicación de Mongo, Redis, Postgres).

#### Variables de Entorno

Valores clave:
- `APP_ENV`: entorno de la aplicación (`development`, `production`, `test`).
- `APP_PUBLIC_PORT`: puerto publicado para el gateway o API.
- `MONGODB_URI`: cadena de conexión; debe incluir usuario/contraseña y `authSource`.
- `REDIS_URL`: URL de Redis con protocolo `redis://`.

Usa `.env.docker` o `.env.ec2` como base y no comprometas secretos en repositorios públicos.