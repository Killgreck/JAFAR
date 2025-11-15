# JAFAR - Sistema de Predicciones y Apuestas

 

## Descripción del Proyecto

 

JAFAR es una plataforma web completa de predicciones y apuestas descentralizadas que permite a los usuarios crear eventos de predicción, apostar en diferentes resultados, y participar en un sistema de curación comunitaria. El sistema implementa un modelo de apuestas tipo **parimutuel** (pool compartido) con odds dinámicos, donde los fondos de los perdedores se distribuyen entre los ganadores.

 

### Características Principales

 

- 🎯 **Creación de Eventos**: Los usuarios pueden crear eventos de predicción en múltiples categorías (Deportes, Política, Entretenimiento, Economía, etc.)

- 💰 **Sistema de Apuestas Parimutuel**: Odds dinámicos que cambian según el pool de apuestas

- 📊 **Sistema de Evidencias**: Proceso de dos fases para recopilar pruebas (creador + comunidad)

- ⚖️ **Curación de Eventos**: Sistema de curadores aprobados que resuelven eventos

- 💳 **Wallet Integrada**: Sistema de billetera con balance disponible y bloqueado

- 🔍 **Búsqueda y Filtrado Avanzado**: Búsqueda por texto, categoría, estado, fechas y ordenamiento

- 📄 **Paginación**: Manejo eficiente de grandes volúmenes de datos

- 🔐 **Seguridad**: Autenticación JWT, protección anti-brute force, transacciones ACID

 

### Tecnologías Utilizadas

 

**Backend:**

- Node.js v18+

- Express.js (API REST)

- TypeScript

- MongoDB (Base de datos NoSQL)

- Mongoose (ODM)

- JWT (Autenticación)

- bcryptjs (Hashing de contraseñas)

 

**Frontend:**

- React 18

- TypeScript

- React Router (Navegación SPA)

- Vite (Build tool)

- Tailwind CSS (Estilos)

- Axios (Cliente HTTP)

 

---

 

## Requisitos Previos

 

Antes de ejecutar el proyecto, asegúrese de tener instalado:

 

- **Node.js** v18 o superior - [Descargar aquí](https://nodejs.org/)

- **npm** v8 o superior (viene con Node.js)

- **MongoDB** v5.0 o superior - [Descargar aquí](https://www.mongodb.com/try/download/community)

  - *Alternativa*: El proyecto puede usar MongoDB Memory Server automáticamente en desarrollo si MongoDB local no está disponible

 

### Verificar instalaciones

 

```bash

# Verificar Node.js

node --version

# Debería mostrar: v18.x.x o superior

 

# Verificar npm

npm --version

# Debería mostrar: 8.x.x o superior

 

# Verificar MongoDB (opcional si usa MongoDB Memory Server)

mongod --version

# Debería mostrar: db version v5.x.x o superior

```

 

---

 

## Instrucciones de Instalación y Ejecución

 

### Paso 1: Clonar el Repositorio

 

```bash

# Clonar el repositorio

git clone https://github.com/Killgreck/JAFAR.git

 

# Entrar al directorio del proyecto

cd JAFAR

 

# Cambiar a la rama MVP

git checkout MVP

```

 

### Paso 2: Configurar el Backend

 

```bash

# Navegar a la carpeta del backend

cd Back

 

# Instalar dependencias

npm install

 

# Este proceso puede tomar 2-3 minutos

```

 

#### Configurar Variables de Entorno (Backend)

 

Crear un archivo `.env` en la carpeta `Back/`:

 

```bash

# Desde la carpeta Back/

touch .env

```

 

Agregar el siguiente contenido al archivo `Back/.env`:

 

```env

# Puerto del servidor

PORT=3000

 

# URL de MongoDB

# Opción 1: MongoDB local

MONGODB_URI=mongodb://localhost:27017/jafar

 

# Opción 2: MongoDB Atlas (cloud)

# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/jafar?retryWrites=true&w=majority

 

# Secreto para JWT (cambiar en producción)

JWT_SECRET=jafar_super_secret_key_2024_change_in_production

 

# Entorno

NODE_ENV=development

```

 

**Nota**: Si MongoDB local no está instalado o no está corriendo, el sistema automáticamente usará MongoDB Memory Server (base de datos en memoria), lo cual es perfecto para pruebas.

 

### Paso 3: Configurar el Frontend

 

Abrir una **nueva terminal** (dejar el backend preparado) y ejecutar:

 

```bash

# Desde la raíz del proyecto JAFAR

cd Front

 

# Instalar dependencias

npm install

 

# Este proceso puede tomar 2-3 minutos

```

 

#### Configurar Variables de Entorno (Frontend)

 

Crear un archivo `.env` en la carpeta `Front/`:

 

```bash

# Desde la carpeta Front/

touch .env

```

 

Agregar el siguiente contenido al archivo `Front/.env`:

 

```env

# URL del backend

VITE_API_URL=http://localhost:3000/api

```

 

### Paso 4: Iniciar MongoDB (Solo si usa MongoDB local)

 

Si tiene MongoDB instalado localmente:

 

```bash

# En una nueva terminal, iniciar MongoDB

mongod

 

# O si usa macOS con Homebrew:

brew services start mongodb-community

 

# O si usa Linux con systemd:

sudo systemctl start mongod

```

 

**Nota**: Si no tiene MongoDB instalado, no se preocupe. El sistema usará MongoDB Memory Server automáticamente.

 

### Paso 5: Ejecutar el Backend

 

```bash

# Desde la carpeta Back/

npm run dev

 

# Deberías ver:

# > back@1.0.0 dev

# > tsx watch --clear-screen=false src/index.ts

#

# Connected to MongoDB

# Server running on http://localhost:3000

```

 

### Paso 6: Ejecutar el Frontend

 

En otra terminal:

 

```bash

# Desde la carpeta Front/

npm run dev

 

# Deberías ver:

# > front@1.0.0 dev

# > vite

#

# VITE v5.x.x ready in xxx ms

#

# ➜ Local:   http://localhost:5173/

# ➜ Network: use --host to expose

```

 

### Paso 7: Acceder a la Aplicación

 

Abrir el navegador en:

 

```

http://localhost:5173

```

 

---

 

## Usuarios de Prueba

 

Al iniciar la aplicación por primera vez, puede crear usuarios nuevos o usar estos datos de prueba:

 

### Crear un Usuario

 

1. Hacer clic en "Registrarse"

2. Ingresar:

   - Email: `usuario@example.com`

   - Username: `usuario1`

   - Password: `password123`

3. El usuario recibirá $0 de balance inicial (puede depositar desde el wallet)

 

### Crear un Evento de Prueba

 

1. Iniciar sesión

2. Hacer clic en "Crear Evento"

3. Llenar el formulario:

   - **Título**: "¿Quién ganará el próximo partido?"

   - **Descripción**: "Predicción sobre el resultado del partido entre equipo A y equipo B"

   - **Categoría**: Deportes

   - **Fecha de cierre de apuestas**: Mínimo 1 hora desde ahora

   - **Fecha de resolución esperada**: Después de la fecha de cierre

   - **Opciones de resultado**: "Equipo A", "Equipo B", "Empate"

4. Hacer clic en "Crear Evento"

 

---

 

## Estructura del Proyecto

 

```

JAFAR/

├── Back/                           # Backend (API REST)

│   ├── src/

│   │   ├── modules/               # Módulos de negocio

│   │   │   ├── users/            # Gestión de usuarios

│   │   │   │   ├── model.ts      # Schema Mongoose

│   │   │   │   ├── service.ts    # Lógica de negocio

│   │   │   │   ├── controller.ts # Controladores HTTP

│   │   │   │   └── routes.ts     # Rutas API

│   │   │   ├── events/           # Gestión de eventos

│   │   │   ├── event-wagers/     # Gestión de apuestas

│   │   │   ├── wallet/           # Sistema de billetera

│   │   │   ├── evidence/         # Sistema de evidencias

│   │   │   ├── curators/         # Sistema de curadores

│   │   │   └── transactions/     # Historial de transacciones

│   │   ├── middleware/           # Middlewares (auth, etc.)

│   │   ├── config/               # Configuración

│   │   ├── app.ts               # Configuración Express

│   │   └── index.ts             # Punto de entrada

│   ├── package.json

│   ├── tsconfig.json

│   └── .env                     # Variables de entorno (crear)

│

├── Front/                         # Frontend (React)

│   ├── src/

│   │   ├── components/           # Componentes reutilizables

│   │   │   ├── Layout.tsx

│   │   │   └── Pagination.tsx

│   │   ├── pages/               # Páginas/Vistas

│   │   │   ├── Login.tsx

│   │   │   ├── Register.tsx

│   │   │   ├── EventsList.tsx

│   │   │   ├── CreateEvent.tsx

│   │   │   ├── EventEvidence.tsx

│   │   │   └── Wallet.tsx

│   │   ├── contexts/            # Contextos React

│   │   │   └── AuthContext.tsx  # Autenticación

│   │   ├── services/            # Llamadas API

│   │   │   ├── api.ts

│   │   │   ├── auth.ts

│   │   │   ├── events.ts

│   │   │   └── wallet.ts

│   │   ├── hooks/               # Custom hooks

│   │   ├── types/               # TypeScript types

│   │   ├── App.tsx

│   │   └── main.tsx

│   ├── package.json

│   ├── vite.config.ts

│   ├── tailwind.config.js

│   └── .env                    # Variables de entorno (crear)

│

├── README.md                    # Este archivo

├── FUNCIONAMIENTO_SISTEMA.md   # Documentación técnica detallada

└── .gitignore

```

 

---

 

## Funcionalidades Principales Implementadas

 

### 1. Gestión de Usuarios

- ✅ Registro de usuarios con validación

- ✅ Login con JWT

- ✅ Roles: Usuario, Curador, Admin

- ✅ Protección anti-brute force (5 intentos = bloqueo 15 min)

- ✅ Sistema de solicitudes para ser curador

 

### 2. Sistema de Eventos

- ✅ Crear eventos de predicción

- ✅ Validación de fechas (deadline mínimo 1 hora)

- ✅ Categorías: Deportes, Política, Entretenimiento, Economía, Otros

- ✅ 2-10 opciones de resultado por evento

- ✅ Búsqueda por texto completo

- ✅ Filtrado por categoría, estado, fechas

- ✅ Ordenamiento: recientes, próximos a cerrar, más apostados

- ✅ Paginación (20 eventos por página)

 

### 3. Sistema de Apuestas

- ✅ Apuestas con modelo parimutuel

- ✅ Odds dinámicos calculados en tiempo real

- ✅ Validación de balance suficiente

- ✅ Sistema de balance bloqueado/disponible

- ✅ Transacciones atómicas (ACID)

- ✅ Historial de apuestas por usuario

 

### 4. Sistema de Evidencias

- ✅ Fase Creador (24h después de cierre)

- ✅ Fase Pública (después de fase creador)

- ✅ Tipos: Link, Imagen, Documento, Video, Texto

- ✅ Sistema de likes para evidencias

- ✅ Validación por fase temporal

 

### 5. Sistema de Wallet

- ✅ Balance disponible y bloqueado separados

- ✅ Creación automática de wallet al registrarse

- ✅ Historial de transacciones

- ✅ Depósitos y retiros

- ✅ Protección contra saldo negativo

 

### 6. Curación de Eventos

- ✅ Solicitud para ser curador

- ✅ Aprobación por administradores

- ✅ Resolución de eventos con evidencia

- ✅ Comisión del 0.5% del pool total

- ✅ Justificación obligatoria de decisión

 

---

 

## Scripts Disponibles

 

### Backend (`Back/`)

 

```bash

# Desarrollo (hot reload)

npm run dev

 

# Compilar TypeScript

npm run build

 

# Ejecutar tests

npm test

 

# Linting

npm run lint

```

 

### Frontend (`Front/`)

 

```bash

# Desarrollo (hot reload)

npm run dev

 

# Build para producción

npm run build

 

# Preview del build

npm run preview

 

# Linting

npm run lint

```

 

---

 

## Solución de Problemas Comunes

 

### Error: "ECONNREFUSED 127.0.0.1:27017"

 

**Problema**: MongoDB no está corriendo.

 

**Solución**:

1. Iniciar MongoDB: `mongod` o `brew services start mongodb-community`

2. O dejar que el sistema use MongoDB Memory Server automáticamente

 

### Error: "Port 3000 already in use"

 

**Problema**: El puerto 3000 está ocupado.

 

**Solución**:

```bash

# Encontrar el proceso

lsof -ti:3000

 

# Matarlo

kill -9 $(lsof -ti:3000)

 

# O cambiar el puerto en Back/.env

PORT=3001

```

 

### Error: "Cannot find module"

 

**Problema**: Dependencias no instaladas.

 

**Solución**:

```bash

# Backend

cd Back && npm install

 

# Frontend

cd Front && npm install

```

 

### Error: "Access denied" al crear wallet

 

**Problema**: Token JWT inválido o expirado.

 

**Solución**:

1. Cerrar sesión

2. Iniciar sesión nuevamente

3. El sistema generará un nuevo token

 

### El frontend no se conecta al backend

 

**Problema**: URL incorrecta en `.env`.

 

**Solución**:

Verificar `Front/.env`:

```env

VITE_API_URL=http://localhost:3000/api

```

 

---

 

## API Endpoints Principales

 

### Autenticación

- `POST /api/users/register` - Registrar usuario

- `POST /api/users/login` - Iniciar sesión

- `GET /api/users/profile` - Obtener perfil (requiere auth)

 

### Eventos

- `GET /api/events` - Listar eventos (con filtros y paginación)

- `GET /api/events/:id` - Obtener evento específico

- `POST /api/events` - Crear evento (requiere auth)

- `POST /api/events/:id/resolve` - Resolver evento (requiere curator)

- `POST /api/events/:id/cancel` - Cancelar evento (requiere admin)

 

### Apuestas

- `POST /api/event-wagers` - Colocar apuesta (requiere auth)

- `GET /api/event-wagers/user` - Mis apuestas (requiere auth)

- `GET /api/event-wagers/event/:eventId` - Apuestas de un evento

 

### Wallet

- `GET /api/wallet` - Obtener wallet (requiere auth)

- `POST /api/wallet/deposit` - Depositar fondos (requiere auth)

- `POST /api/wallet/withdraw` - Retirar fondos (requiere auth)

- `GET /api/wallet/transactions` - Historial de transacciones (requiere auth)

 

### Evidencias

- `POST /api/evidence` - Subir evidencia (requiere auth)

- `GET /api/evidence/:eventId` - Listar evidencias de un evento

- `POST /api/evidence/:id/like` - Dar like a evidencia (requiere auth)

 

### Curadores

- `POST /api/curators/request` - Solicitar ser curador (requiere auth)

- `GET /api/curators/requests` - Listar solicitudes (requiere admin)

- `POST /api/curators/requests/:id/approve` - Aprobar solicitud (requiere admin)

- `POST /api/curators/requests/:id/reject` - Rechazar solicitud (requiere admin)

 

---

 

## Contacto y Soporte

 

Para dudas o problemas:

- **Repositorio**: https://github.com/Killgreck/JAFAR

- **Issues**: https://github.com/Killgreck/JAFAR/issues

- **Documentación Técnica**: Ver `FUNCIONAMIENTO_SISTEMA.md` para detalles de implementación

 

---

 

## Licencia

 

Este proyecto es parte de un trabajo académico universitario.

 

---

 

## Notas Adicionales

 

- El sistema usa transacciones MongoDB para garantizar consistencia en operaciones críticas

- Las contraseñas se hashean con bcrypt (10 rounds)

- Los tokens JWT expiran en 7 días

- El sistema soporta concurrencia mediante transacciones ACID

- La base de datos incluye índices optimizados para búsqueda y ordenamiento

 

**¡Gracias por revisar JAFAR!** 🎯
