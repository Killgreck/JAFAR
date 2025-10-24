### README – Plataforma de Apuestas P2P “jafar”

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


Para despliegues de alta seguridad en AWS EC2 revisa `deploy/README.md`, que incluye `docker-compose.core.yml` (microservicios) y `docker-compose.data.yml` (capa de datos + replicación de Mongo, Redis, Postgres).

#### Variables de Entorno

Valores clave:
- `APP_ENV`: entorno de la aplicación (`development`, `production`, `test`).
- `APP_PUBLIC_PORT`: puerto publicado para el gateway o API.
- `MONGODB_URI`: cadena de conexión; debe incluir usuario/contraseña y `authSource`.
- `REDIS_URL`: URL de Redis con protocolo `redis://`.
