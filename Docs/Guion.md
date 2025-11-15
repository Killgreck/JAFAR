# Guion de Desarrollo del Proyecto

## Merge pull request #20 from Killgreck/feat/crear-guion-md
*Fecha: 2025-11-14*
*Autor: Killgreck*
*Commit: 58a8d33*

feat: Crear archivo Guion.md con historial de commits
---

## Merge pull request #19 from Killgreck/claude/admin-view-list-only-016sAkBWqXBSY1Vc253P6A76
*Fecha: 2025-11-14*
*Autor: Killgreck*
*Commit: 80ba6b7*

feat: Restringir permisos de admins y curadores en el frontend
---

## Merge pull request #18 from Killgreck/feat/generar-guion-commits
*Fecha: 2025-11-14*
*Autor: Killgreck*
*Commit: da3486b*

feat: Crear script para generar guion de commits
---

## feat: Restringir permisos de admins y curadores en el frontend
*Fecha: 2025-11-15*
*Autor: Claude*
*Commit: 431372b*

- AdminUsers: Admins ahora solo pueden ver la lista de usuarios sin opciones de banear/desbanear o cambiar roles
- CuratorPanel: Añadir validación adicional para asegurar que curadores solo puedan resolver eventos no resueltos
- Agregar mensajes informativos en ambos paneles explicando las restricciones
- Mostrar estado del evento (Abierto/Cerrado) en el panel de curador

---

## Merge pull request #17 from Killgreck/claude/copy-user-profile-management-01TMjgTAJypm19ZwoDzXyyRA
*Fecha: 2025-11-15*
*Autor: miguelRamirezr1*
*Commit: d5643d2*

Claude/copy user profile management correction of Front and Back
---

## fix: Corregir errores de sintaxis en backend y frontend
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: baae5d4*

Backend (events/service.ts):
- Agregar cierre de interfaces ListEventsParams y PaginatedEventsResponse
- Agregar campos page y limit faltantes
- Corregir cierre de función listEventsPaginated

Frontend (EventsList.tsx):
- Eliminar declaraciones duplicadas de variables pagination y setPagination
- Limpiar código duplicado de filtros, búsqueda y paginación
- Corregir estructura JSX mal formada
- Eliminar funciones handleClearFilters y clearFilters duplicadas
- Usar hook useDebounce correctamente

Estos errores fueron causados por un merge conflictivo que dejó código duplicado.

---

## fix: Corregir errores de sintaxis en events/service.ts
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: a924caa*

- Agregar cierre de interfaz ListEventsParams con campos page y limit
- Agregar cierre de interfaz PaginatedEventsResponse
- Agregar cierre correcto de función listEventsPaginated

Esto corrige el error "Unexpected *" que impedía la ejecución del backend.

---

## Merge pull request #16 from Killgreck/claude/copy-user-profile-management-01TMjgTAJypm19ZwoDzXyyRA
*Fecha: 2025-11-15*
*Autor: miguelRamirezr1*
*Commit: 7d6f25c*

fix: Eliminar binario de MongoDB del repositorio (63 MB)
---

## fix: Eliminar binario de MongoDB del repositorio (63 MB)
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 991f4c0*

Este archivo binario estaba causando errores al clonar el repositorio
debido a su gran tamaño. El archivo ya está correctamente ignorado en
.gitignore y se descarga automáticamente cuando es necesario.

---

## Merge pull request #15 from Killgreck/claude/user-profile-management-01TetrgaqQKvna14CSPqCqQt
*Fecha: 2025-11-15*
*Autor: miguelRamirezr1*
*Commit: 41bd126*

chore: Agregar script de sincronización para servidor local
---

## chore: Agregar script de sincronización para servidor local
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 13ed46e*


---

## Merge pull request #14 from Killgreck/claude/event-search-filters-016ZzvdM3LhJWpFYyjXioWwj
*Fecha: 2025-11-14*
*Autor: Killgreck*
*Commit: 50bd833*

Claude/event search filters 016 zzvd m3 lh j wp f yyj xio wwj
---

## Merge branch 'main' into claude/event-search-filters-016ZzvdM3LhJWpFYyjXioWwj
*Fecha: 2025-11-14*
*Autor: Killgreck*
*Commit: f57e7d1*


---

## docs: Add Pull Request description template
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 473941d*


---

## Merge pull request #12 from Killgreck/claude/user-profile-management-01TetrgaqQKvna14CSPqCqQt
*Fecha: 2025-11-14*
*Autor: miguelRamirezr1*
*Commit: 6719015*

fix: Corregir orden de rutas de transacciones y eliminar ruta conflic…
---

## fix: Corregir orden de rutas de transacciones y eliminar ruta conflictiva
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 9216f57*

- Mover ruta /stats antes de ruta genérica /transactions para evitar conflictos
- Eliminar ruta /transactions/:id que causaba conflicto con /:userId/transactions
- Eliminar método getById del servicio frontend (ruta no implementada)
- Agregar comentario indicando que el router se monta bajo /api/wallet

El problema era que la ruta /transactions/:id podría ser capturada por /:userId/transactions
interpretando "transactions" como un userId, causando routing incorrecto.

---

## Merge pull request #11 from Killgreck/claude/user-profile-management-01TetrgaqQKvna14CSPqCqQt
*Fecha: 2025-11-14*
*Autor: miguelRamirezr1*
*Commit: c5209a4*

feat: Implementar historial de transacciones completo
---

## feat: Implementar historial de transacciones completo
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 29335dc*

Backend:
- Crear modelo Transaction con índices optimizados (user+createdAt, type, related entities)
- Implementar servicio de transacciones con paginación (50/página) y filtros (type, dateFrom, dateTo)
- Crear controlador con autorización (usuarios solo ven sus transacciones, admin ve todas)
- Agregar rutas en wallet router (/wallet/:userId/transactions, /wallet/:userId/transactions/stats)
- Soportar 7 tipos de transacciones: deposit, withdraw, block, release, win, loss, commission

Frontend:
- Crear tipos TypeScript para Transaction y filtros
- Implementar servicio de API para transacciones con paginación
- Crear página TransactionHistory con:
  * Tabla completa mostrando fecha, tipo, monto, balance resultante, descripción
  * Tarjetas de estadísticas (total transacciones, depósitos, retiros, ganancias, pérdidas, ganancia neta)
  * Filtro por tipo de transacción
  * Paginación inteligente (50 transacciones por página)
  * Formateo de montos y fechas en español
  * Color coding por tipo (verde=positivo, rojo=negativo, amarillo=bloqueo, azul=comisión)
  * Enlaces a eventos/apuestas relacionados
- Agregar ruta /transactions con ProtectedRoute
- Agregar botón "Transacciones" en navegación

Características:
- Ordenamiento por fecha descendente (más reciente primero)
- Populate de entidades relacionadas (eventos, apuestas)
- Autorización: usuarios solo ven sus transacciones, admin ve todas
- Paginación eficiente con índices de MongoDB
- Estadísticas agregadas usando MongoDB aggregation pipeline

---

## feat: Implement comprehensive event search and filtering system
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: d5fb2bb*

Implements user story for searching and filtering events with multiple criteria
and pagination support (20 events per page).

BACKEND CHANGES:
- Added text indexes for title and description search in EventSchema
- Added compound index for category, status, and bettingDeadline
- Created new interfaces: ListEventsParams, PaginatedEventsResponse, SortOption
- Implemented listEventsPaginated() function with:
  * Text search (title/description) with case-insensitive regex
  * Date range filtering (dateFrom/dateTo on bettingDeadline)
  * Multiple sort options (recent, closingSoon, mostBetted)
  * Pagination with metadata (page, limit, total, totalPages, hasNext, hasPrev)
  * MongoDB aggregation to calculate totalAmount from event-wagers
- Updated EventsController.list() to handle all new query parameters
- Enhanced API response to include sanitized events and pagination metadata

FRONTEND CHANGES:
- Added totalAmount field to Event interface
- Created new PaginationMeta and PaginatedResponse<T> interfaces
- Built reusable Pagination component with navigation controls
- Implemented useDebounce custom hook (300ms delay)
- Completely refactored EventsList.tsx with:
  * Search input with debounce for real-time filtering
  * Category and status filters (existing, preserved)
  * Date range filters (dateFrom/dateTo)
  * Sort selector (most recent, closing soon, most betted)
  * Pagination controls with page navigation
  * Results counter showing filtered/total events
  * Clear filters button to reset all criteria
  * Display of totalAmount for each event
  * Improved UX with smooth scrolling on page change
- Added listPaginated() method to eventsService

FEATURES IMPLEMENTED:
✓ Search bar for title/description
✓ Filter by category
✓ Filter by date range
✓ Filter by status
✓ Sort by: most recent, closing soon, most betted
✓ Pagination (20 events per page)
✓ Display: title, category, deadline, total betted
✓ Results counter with filter indication
✓ Clear filters functionality
✓ Debounced search for performance

TECHNICAL DETAILS:
- MongoDB aggregation pipeline with $lookup for totalAmount calculation
- Optimized with text and compound indexes
- Responsive UI with Tailwind CSS
- Type-safe implementation with TypeScript
- Maintains backward compatibility with existing list() method

Resolves user story requirements for event discovery and filtering.

---

## Merge pull request #10 from Killgreck/claude/user-profile-management-01TetrgaqQKvna14CSPqCqQt
*Fecha: 2025-11-14*
*Autor: miguelRamirezr1*
*Commit: db7f1c3*

feat: Implementar sistema completo de búsqueda y filtrado de eventos
---

## feat: Implementar sistema completo de búsqueda y filtrado de eventos
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: ada9de0*

Backend:
- Agregar campo totalBets al modelo Event para tracking de apuestas
- Agregar índices MongoDB para optimización:
  - Índice text en title y description para búsqueda full-text
  - Índice en totalBets para ordenamiento
  - Índice en createdAt para ordenamiento
- Implementar función searchEvents con:
  - Búsqueda full-text en título/descripción
  - Filtros: categoría, estado, rango de fechas (bettingDeadline)
  - Ordenamiento: recent, closing_soon, most_bets
  - Paginación (20 por página, configurable hasta 100)
- Crear endpoint GET /api/events/search con query params
- Actualizar sanitizeEvent para incluir todos los campos

Frontend:
- Agregar tipos TypeScript: EventSearchParams, PaginationInfo, EventSearchResult
- Actualizar interface Event con totalBets
- Crear servicio eventsService.search() con soporte de parámetros
- Rehacer EventsList con:
  - Barra de búsqueda con debouncing (500ms)
  - Filtros múltiples: categoría, estado, rango de fechas, ordenamiento
  - Contador de resultados encontrados
  - Paginación completa con navegación numérica
  - Display de totalBets en cada evento
  - Botón "Limpiar Filtros"
  - Responsive design mejorado

Cumple con todos los criterios de aceptación:
✓ Barra de búsqueda por texto en título/descripción
✓ Filtros: categoría, rango de fechas, estado
✓ Ordenamiento: más recientes, próximos a cerrar, más apostados
✓ Paginación de 20 eventos por página
✓ Resultados muestran: título, categoría, fecha límite, total apostado
✓ Contador de resultados encontrados
✓ Búsqueda full-text implementada
✓ Índices de MongoDB agregados

---

## Merge pull request #9 from Killgreck/claude/user-profile-management-01TetrgaqQKvna14CSPqCqQt
*Fecha: 2025-11-14*
*Autor: miguelRamirezr1*
*Commit: d49c51d*

Implementar gestión completa de perfil de usuario
---

## Merge branch 'main' into claude/user-profile-management-01TetrgaqQKvna14CSPqCqQt
*Fecha: 2025-11-14*
*Autor: miguelRamirezr1*
*Commit: 1925c87*


---

## Merge pull request #8 from Killgreck/claude/admin-user-event-management-01EFQxSgdoW4zBqBtTDcJfaq
*Fecha: 2025-11-14*
*Autor: Killgreck*
*Commit: 9431f55*

Claude/admin user event management 01 ef qx sgdo w4z bq bt t dc jfaq
---

## feat: Implementar gestión completa de perfil de usuario
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 5e51ee1*

Backend:
- Agregar campo avatar al modelo User
- Crear endpoint GET /api/users/profile con estadísticas de apuestas
  - Mostrar username, email, fecha de registro, avatar, balance
  - Calcular estadísticas: total bets, won, lost, active, success rate
- Crear endpoint PUT /api/users/profile para actualizar perfil
  - Validar unicidad de username
  - Permitir actualizar username y avatar
- Agregar servicios: getUserProfile, updateUserProfile, isUsernameAvailable

Frontend:
- Crear página Profile.tsx con vista y edición de perfil
- Mostrar información personal con avatar
- Mostrar estadísticas de apuestas en tarjetas visuales
- Incluir gráficos de tasa de éxito/fracaso
- Permitir editar username y avatar con validación
- Agregar tipos TypeScript: UserProfile, UserStatistics, UpdateProfileData
- Crear profileService con getProfile y updateProfile
- Agregar ruta /profile protegida
- Agregar enlace de navegación "Perfil" en Layout

Cumple con todos los criterios de aceptación:
✓ Muestra username, email, fecha de registro, avatar
✓ Muestra estadísticas: apuestas totales, ganadas, perdidas, ratio éxito
✓ Permite editar username y avatar
✓ Valida unicidad de username
✓ Cambios se guardan y reflejan inmediatamente

---

## fix: Update user tests to match new API endpoints (Phase 3)
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 2bfe418*

- Fixed users.test.ts to use /api/users/register instead of /api/users
- Updated test expectations to match new response structure {token, user}
- Fixed authentication requirements for user profile endpoints
- Updated users-extended.test.ts POST endpoints to use correct registration endpoint
- Verified rate limiting tests pass successfully

These changes align with the refactored authentication API structure.

---

## feat: Implement login rate limiting (Phase 2)
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 03a63ec*

- Add loginAttempts and lockUntil fields to User model
- Lock account for 15 minutes after 5 failed login attempts
- Reset attempts counter on successful login
- Return 429 status code with clear message when account is locked
- Add comprehensive test coverage for rate limiting scenarios
- Track attempts per user (not globally) to prevent enumeration

Security improvements:
- Prevents brute force attacks with exponential backoff
- Does not reveal user existence through rate limiting errors
- Automatically unlocks accounts after 15 minutes
- Resets counter on successful authentication

Implements security requirement: 5 failed attempts = 15 min lockout
All 8 rate limiting tests passing ✓

---

## feat: Improve authentication security (Phase 1)
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 70b8e0b*

- Add email format validation with regex in model and controller
- Increase bcrypt cost factor from 10 to 12 for stronger password hashing
- Change JWT expiration from 7 days to 24 hours
- Include username in JWT payload alongside userId, email, and role

All changes align with security requirements and best practices.

---

## feat: Add comprehensive E2E critical flows test suite
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: e40a36f*

Add end-to-end tests covering all critical business flows:
- Registration → Login → Dashboard
- Deposit → Create Event → Place Bet
- Counter Bet → Matching
- Evidence Submission → Likes → Curation
- Event Resolution → Fund Distribution
- Admin User Management (search, ban/unban, role changes)
- Admin Event Management (cancel, modify dates, filters)
- Transaction History

These tests validate complete user journeys from start to finish,
ensuring all major features work together correctly.

---

## Merge pull request #7 from Killgreck/claude/admin-user-event-management-01EFQxSgdoW4zBqBtTDcJfaq
*Fecha: 2025-11-14*
*Autor: Killgreck*
*Commit: c1f3a72*

feat: Implement comprehensive admin user and event management
---

## feat: Complete curator frontend integration with evidence likes and phase indicators
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 715844d*

Changes:
- EventsList: Added evidence phase badges (creator/public) with time remaining
- EventEvidence: Added like/unlike functionality with heart icons, sorted by votes
- Layout: Added "Panel de Curador" navigation link for curators and admins
- App.tsx: Added curator route with CuratorRoute protection

All curator system features are now fully integrated and functional.

---

## feat: Add curator panel and evidence likes UI (partial)
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: f4b5f92*

## Curator Panel
- Create CuratorRoute component for access control
- Create CuratorPanel page with event curation interface
- Display events ready for curation sorted by deadline
- Show evidences sorted by likes
- Allow curators to resolve events with justification

## Evidence Likes
- Add likes/likesCount fields to Evidence type
- Add likeEvidence/unlikeEvidence to evidence service
- Curator service with getEventsForCuration and resolveEvent

## UI Features
- View evidences with like count display
- Sort evidences by most liked first
- Show submitter role badges (creator/public/curator)
- Event resolution with winning option selection

Pending: Update EventsList, EventEvidence pages, Layout links, App routes

---

## feat: Implement curator system and evidence phase management
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: f7ff54e*

## Evidence Likes System
- Add likes array and likesCount to Evidence model
- Implement likeEvidence/unlikeEvidence services
- Add POST/DELETE /events/:eventId/evidence/:evidenceId/like endpoints
- Index evidence by likesCount for sorting
- Prevent duplicate likes from same user

## Evidence Phase Management
- Add updateEvidencePhase service to automatically update phases
- Phases: none → creator (24h) → public
- Auto-update phase when fetching events
- getEventsReadyForCuration service for curator panel

## Curator Endpoints
- GET /events/curation/ready - Events ready for curation
- POST /events/:id/resolve - Now accessible by curators (requireCuratorOrAdmin)
- Curators can resolve events after evidence deadline

## Phase Logic
- Before bettingDeadline: phase = 'none' (no evidence)
- bettingDeadline to evidenceDeadline: phase = 'creator' (only creator)
- After evidenceDeadline: phase = 'public' (anyone except creator)

All curator endpoints protected with requireCuratorOrAdmin middleware.

---

## feat: Add comprehensive admin UI for user and event management
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: ecd8beb*

## Frontend Admin Features

### User Management UI (AdminUsers page)
- Search users by name, username, or email
- View all banned users list
- Ban/unban users with optional reason
- Change user roles (user/curator/admin)
- Display user information with role and ban status badges
- Real-time feedback with success/error messages

### Event Management UI (AdminEvents page)
- View all events with filters by status
- Cancel events with automatic refund (admin only)
- Modify event dates (betting deadline & resolution date)
- Visual status indicators (open/closed/resolved/cancelled)
- Restrictions: Only open events can be modified

### Type System Updates
- Add UserRole and CuratorStatus types
- Extend User interface with role, curatorStatus, isBanned fields
- Add admin-specific interfaces (BanUserData, ChangeRoleData, etc.)

### Services & API Integration
- Create admin.ts service with all admin API calls
- User management: searchUsers, getBannedUsers, banUser, unbanUser, changeUserRole
- Event management: cancelEvent, updateEventDates

### Routing & Security
- Add AdminRoute component for role-based access control
- Add /admin/users and /admin/events routes
- Auto-redirect non-admin users to dashboard

### Navigation Enhancements
- Add admin menu items in Layout (visible only to admins)
- Display user role badge in header (Admin/Curador/Usuario)
- Highlight admin menu items in red for visibility

All UI components follow existing design system with dark theme.

---

## feat: Implement comprehensive admin user and event management
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: a2636f8*

## User Management Features
- Add ban system with isBanned, bannedAt, bannedBy, and banReason fields
- Create checkBannedUser middleware to block banned users
- Implement ban/unban service functions
- Add endpoints: POST /users/:id/ban, POST /users/:id/unban
- Add role management: PATCH /users/:id/role (user/curator/admin)
- Implement user search: GET /users/search?q=query
- Add banned users list: GET /users/banned
- Prevent self-banning and self-role-change

## Event Management Features
- Add event cancellation with automatic refunds: POST /events/:id/cancel
- Implement updateEventDates for modifying event schedules: PATCH /events/:id/dates
- Protect admin-only endpoints with requireAdmin middleware
- Refund system processes all wagers and returns funds to wallets

## Security Improvements
- All admin endpoints now require admin role authentication
- Add checkBannedUser middleware to all protected routes
- Prevent banned users from accessing the platform
- Validate ObjectIds and prevent invalid operations

All endpoints properly secured with authentication and authorization checks.

---

## feat: Implement event management page and navigation
*Fecha: 2025-11-14*
*Autor: Claude*
*Commit: 404e165*

Resolves TODO comment in EventsList.tsx by implementing:
- New EventManagement page component for event creators
- Route /events/:eventId/manage for accessing event management
- Navigation from "Administrar" button in EventsList
- Event details display with status badges
- Cancel event functionality for open events
- Quick access to evidence management
- Permission checking to ensure only creators can access

The management page provides event creators with:
- Full event details and current status
- Ability to cancel open events
- Direct link to evidence management
- Clear information about event lifecycle

---

## fix: Include role and curatorStatus in user responses
*Fecha: 2025-11-14*
*Autor: Miguel Legarda*
*Commit: 193bc8b*

El login y endpoints de usuario ahora devuelven role y curatorStatus,
permitiendo al frontend identificar admins y curadores correctamente.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

---

## Merge pull request #6 from Killgreck/claude/setup-env-and-run-tests-011CV5CU4sPjC7Pj7pbbfP4j
*Fecha: 2025-11-14*
*Autor: Killgreck*
*Commit: b797413*

feat: Implement Evidence System, Curators, and Event-Wagers
---

## feat: Add frontend support for evidence and events system
*Fecha: 2025-11-14*
*Autor: Ubuntu*
*Commit: ee281da*

Implementación de la interfaz de usuario para el sistema de evidencia y gestión de eventos:

- Nuevas páginas: EventsList y EventEvidence
- Tipos TypeScript para Evidence (link, image, document, video, text)
- Tipos para SubmitterRole (creator, public, curator)
- Campos adicionales en Event para evidencia y resolución
- Rutas protegidas para /events y /events/:eventId/evidence
- Servicio de evidencia para comunicación con backend
- Mejoras en navegación y layout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

---

## chore: Remove node_modules and dist from version control
*Fecha: 2025-11-14*
*Autor: Ubuntu*
*Commit: 51ed6b2*

Eliminación de archivos generados que no deberían estar en el repositorio. Estos archivos ya están en .gitignore y se generan automáticamente en cada instalación/build.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

---

## Merge pull request #5 from Killgreck/claude/setup-env-and-run-tests-011CV5CU4sPjC7Pj7pbbfP4j
*Fecha: 2025-11-13*
*Autor: Killgreck*
*Commit: b2202dc*

Claude/setup env and run tests 011 cv5 cu4s pj c7 pj7pbbf p4j
---

## chore: Update package-lock.json after reinstalling dependencies
*Fecha: 2025-11-13*
*Autor: Claude*
*Commit: f842c36*

Reinstalled backend node_modules to fix esbuild binary version mismatch error that was preventing the development server from starting. This update ensures platform-specific binaries are correctly installed for Linux.

Changes:
- Updated Back/package-lock.json with refreshed dependency tree
- Removed Windows-specific binaries (@esbuild/win32-x64, @rollup/rollup-win32-x64-*)
- Added Linux-specific platform binaries

This resolves the "Host version does not match binary version" error when running npm run dev.

---

## feat: Add frontend interface for event creation
*Fecha: 2025-11-13*
*Autor: Claude*
*Commit: 11e992b*

Implemented a complete interface for authenticated users to create betting events from the frontend. The interface includes comprehensive form validation matching backend requirements and a clean, user-friendly design.

Changes:
- Added Event types and interfaces to Front/src/types/index.ts (EventCategory, EventStatus, Event, CreateEventData)
- Created events service (Front/src/services/events.ts) with list, getById, create, updateStatus, and resolve methods
- Created CreateEvent page component (Front/src/pages/CreateEvent.tsx) with:
  * Form fields: title (10-200 chars), description (20-1000 chars), category dropdown, betting deadline, expected resolution date, and dynamic result options (2-10)
  * Client-side validation matching backend rules (deadlines must be 1+ hour in future, resolution after deadline)
  * Error handling and loading states
  * Responsive design following existing UI patterns
- Added /create-event protected route to App.tsx
- Updated Dashboard with "Crear Nuevo Evento" button in quick actions section

All form validation aligns with backend validation rules in Back/src/modules/events/model.ts and service.ts

---

## Merge pull request #4 from Killgreck/claude/setup-env-and-run-tests-011CV5CU4sPjC7Pj7pbbfP4j
*Fecha: 2025-11-13*
*Autor: Killgreck*
*Commit: 13d8892*

Claude/setup env and run tests 011 cv5 cu4s pj c7 pj7pbbf p4j
---

## feat: Implement betting events creation with authentication and validation
*Fecha: 2025-11-13*
*Autor: Claude*
*Commit: 0388373*

Implements complete event creation system allowing authenticated users
to create betting events with multiple outcome options.

**New modules:**
- Auth middleware: JWT-based authentication for protected endpoints
- Events module: Full CRUD operations for betting events

**Event Model:**
- Title validation (10-200 characters)
- Description validation (20-1000 characters)
- Category enum (Deportes, Política, Entretenimiento, Economía, Otros)
- Betting deadline (min 1 hour from now)
- Expected resolution date (must be after deadline)
- Result options array (2-10 options)
- Status tracking (open/closed/resolved/cancelled)

**API Endpoints:**
- POST /api/events - Create event (authenticated)
- GET /api/events - List events with filters
- GET /api/events/:id - Get specific event
- PUT /api/events/:id/status - Update event status
- POST /api/events/:id/resolve - Resolve event with winner

**Validation:**
- All dates validated (no past deadlines, logical ordering)
- Category must be from valid enum
- Result options count constrained
- JWT authentication required
- MongoDB indexes for performance

**Tests:** 31/35 passing (88.6%)
- Core functionality: 100% passing
- Extended validation: 100% passing
- Error coverage: 100% passing
- 4 edge cases pending (Mongoose validation errors)

**Acceptance Criteria Met:**
✅ Authenticated users can create events
✅ Date validations (deadline > now + 1h, resolution > deadline)
✅ Title/description length validation
✅ Valid category enforcement
✅ Result options array 2-10 elements
✅ No past deadlines allowed
✅ CreatorId from auth token
✅ Returns 201 with created event
✅ Initial status is "open"

Related: Event management system, user story #events-creation

---

## feat: Implement automatic wallet creation with balanceAvailable and balanceBlocked
*Fecha: 2025-11-13*
*Autor: Claude*
*Commit: 1792f86*

Implements user story for automatic wallet creation when users are registered.

Changes:
- Updated Wallet model with new fields:
  * balanceAvailable: funds available for bets/withdrawals
  * balanceBlocked: funds locked in active bets
  * lastUpdated: timestamp of last transaction
  * balance: kept for backwards compatibility (deprecated)

- Added post-save hook in User model to automatically create wallet
  with zero balances when new users are created

- Updated wallet service to support both old and new field structures
  for backwards compatibility

- Updated wallet controller to sanitize and return new fields

- Updated wallet tests to verify automatic creation and new fields

All wallet tests passing (6/6). Maintains 1:1 relationship between
User and Wallet. Balance validation ensures non-negative values.

Fixes: Automatic wallet creation upon user registration
Related: User wallet management feature

---

## chore: Update package-lock.json after reinstalling dependencies
*Fecha: 2025-11-13*
*Autor: Claude*
*Commit: 2142115*

Reinstalled backend dependencies to fix rollup module issue on Linux.
This updates the lock file with correct platform-specific binaries.

---

## Merge pull request #3 from miguelRamirezr1/main
*Fecha: 2025-11-12*
*Autor: miguelRamirezr1*
*Commit: ccf1a3c*

añadir implementación Frontend
---

## Merge pull request #1 from miguelRamirezr1/claude/frontend-setup-011CV3FMJZ3uNJoEiTvARgjV
*Fecha: 2025-11-12*
*Autor: miguelRamirezr1*
*Commit: f2bf557*

Claude/frontend setup
---

## fix: Update Dashboard for prediction market model
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: 4039e35*

Fixed Dashboard to work with new prediction market data structure:

Changes:
- Import wagersService to fetch user's wagers
- Load user wagers on component mount
- Replace activeBets logic with activeWagersCount based on wagers
- Update stats cards:
  - Balance (unchanged)
  - Apuestas Activas: now shows count of user's active wagers
  - Total Apostado: shows sum of all user's wager amounts
- Update recent predictions list:
  - Use bet.question instead of bet.description
  - Calculate totalPool (totalForAmount + totalAgainstAmount)
  - Display pool total instead of individual bet amount
  - Update status labels (open/settled/cancelled)
- Fix all color classes to dark mode theme
- Update button labels to "predicción" terminology
- Make prediction cards clickable to navigate to bets page

This fixes the dashboard display issues after creating predictions.

---

## refactor: Transform to prediction market model
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: 230239b*

Complete overhaul from 1-on-1 betting to prediction market system where multiple
users can bet on either side of any prediction question.

Backend Changes:
===============
Bet Model (Prediction):
- Removed: opponent, amount, creatorSide fields
- Added: question field instead of description
- Added: totalForAmount and totalAgainstAmount tracking
- Added: result and settledAt fields for settlement
- Updated: status enum (removed 'accepted')

Wager Model (NEW):
- Tracks individual user bets on predictions
- Fields: bet, user, side, amount, odds, payout
- Records odds at time of placement for fair settlement

Bet Service:
- Simplified createBet to only create prediction questions
- Removed acceptBet (replaced by wager placement)
- No balance deduction at prediction creation

Wager Service (NEW):
- placeWager: Places bet on either side, deducts balance
- calculateOdds: Dynamic odds based on pool distribution
- getWagersByBet/User: Query wager history

API Routes:
- POST /api/bets - Create prediction question
- POST /api/wagers - Place wager on prediction
- GET /api/wagers/bet/:betId - Get all wagers for bet
- GET /api/wagers/user/:userId - Get user's wagers

Frontend Changes:
================
Types:
- Updated Bet interface with prediction market fields
- Added Wager and PlaceWagerData interfaces
- Simplified CreateBetData to just creator + question

CreateBet Page:
- Removed amount and side selection
- Simple form to create prediction questions
- No balance deduction at creation

BetsList Page:
- Complete redesign as prediction market interface
- Shows odds for both sides (e.g., 2.5x, 1.8x)
- Displays probabilities as percentages
- Visual progress bar showing pool distribution
- Users select side (For/Against) and amount
- Real-time potential payout calculation
- Balance updates after placing wagers

Key Features:
- Multiple users can bet on same side
- Odds adjust dynamically based on pool
- Higher payouts for less popular side
- Example: 10% betting "For" = 10x payout potential
- Example: 90% betting "Against" = 1.1x payout

This matches standard prediction market platforms like Polymarket,
Kalshi, and PredictIt where probabilities emerge from market activity.

---

## feat: Add for/against betting system with balance refresh
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: 302c775*

Implemented comprehensive betting side selection and real-time balance updates:

Backend changes:
- Added creatorSide field to bet model (for/against enum)
- Implemented acceptBet endpoint with balance deduction for opponent
- Added validation to prevent accepting own bets
- Updated bet creation to deduct balance from creator immediately

Frontend changes:
- Added radio button selection for for/against in CreateBet form
- Display creator's position and opponent's automatic opposite position
- Implemented accept bet button with side indication
- Added refreshUser method to AuthContext for real-time balance updates
- Balance now updates immediately after creating or accepting bets
- Enhanced BetsList UI to show positions for both creator and opponent
- Added loading states for accept bet operation

Fixes:
- Balance now updates in UI after bet operations
- Users can now choose which side of a bet they're taking
- Opponents see which side they'll take before accepting

---

## feat: Add dark mode theme, initial $25 balance, and welcome bonus modal
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: e9be2fc*

Backend changes:
- Add balance field to User model with default value of 25
- Update user controller to include balance in sanitized response
- Implement balance deduction when creating bets
- Add validation for insufficient balance

Frontend changes:
- Convert entire UI to dark mode theme
  - Dark backgrounds (gray-900, gray-800)
  - Light text colors (gray-100, gray-200, gray-300)
  - Adjusted button and input colors for dark theme
  - Updated all page components with dark mode colors
- Add WelcomeModal component to display $25 bonus notification
- Show welcome modal on first registration
- Show welcome modal on first login (tracked via localStorage)
- Update all form labels and text colors for readability
- Update Home page with dark gradient background
- Update Layout navbar with dark theme

Features:
- All new users start with $25 balance
- Creating a bet deducts the amount from user balance
- Welcome modal celebrates the $25 bonus with animation
- Consistent dark theme across all pages
- Improved visual hierarchy with proper contrast ratios

---

## feat: Add bet creation and listing functionality
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: 10d97a1*

Frontend changes:
- Add CreateBet page with form to create new bets
- Add BetsList page to view all bets with status badges
- Update Dashboard to show active bets count and recent bets
- Add bets service for API integration
- Update Bet type to match backend schema
- Add routing for /create-bet and /bets pages
- Connect action buttons in Dashboard to new pages

Features:
- Users can create bets with description and amount
- Users can view all bets with filtering by status
- Dashboard shows real-time active bets count
- Dashboard displays 5 most recent bets
- Automatic navigation after bet creation
- Protected routes for authenticated users only

---

## fix: Correct dev and start scripts to use index.ts entry point
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: ffe868f*


---

## feat: Add MongoDB Memory Server fallback for development
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: e9d88b0*

- Configure database to use MongoDB Memory Server when local MongoDB is unavailable
- Add tsx to devDependencies for dev script
- Improves developer experience by not requiring local MongoDB installation

This allows the backend to start automatically in development mode without needing MongoDB installed locally.

---

## feat: Add authentication endpoints with JWT support
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: 0ae09c7*

- Install bcryptjs and jsonwebtoken dependencies
- Add login and register endpoints to users routes
- Implement password hashing with bcrypt
- Generate JWT tokens on login and registration
- Add getUserByEmail service function
- Update controller with login and register methods
- Return user data and token on successful authentication

This enables the frontend to authenticate users and receive JWT tokens for protected routes.

---

## fix: Update to Tailwind CSS v4 syntax with @import directive
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: 2caf0c0*


---

## fix: Update PostCSS config to use @tailwindcss/postcss plugin
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: b65aa5d*


---

## chore: Add .env to .gitignore for security
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: 3692ecc*


---

## feat: Add complete React frontend setup with authentication
*Fecha: 2025-11-12*
*Autor: Claude*
*Commit: c4a61ab*

- Initialize React project with TypeScript and Vite
- Configure Tailwind CSS for styling
- Add React Router for navigation
- Implement authentication context and services
- Create Login and Register pages with form validation
- Create Dashboard page with user stats
- Add protected routes and layout components
- Configure API integration with backend
- Set up environment variables for API URL
- Add comprehensive project documentation

The frontend includes:
- Home page with platform overview
- User authentication (login/register)
- Protected dashboard with user information
- Responsive design with Tailwind CSS
- Integration with backend API endpoints

---

## Merge pull request #1 from Killgreck/docs-add-comprehensive-documentation
*Fecha: 2025-11-02*
*Autor: Killgreck*
*Commit: c886a0f*

docs: Add comprehensive documentation to the backend
---

## feat: add password minimum length validation (8 characters)- Add password length validation in users controller- Add test for password shorter than 8 characters- Add extended tests for password length validation (less than 8, exactly 8, more than 8)- Update duplicate user tests to use valid passwords- Achieve 100% test coverage for user registration requirements
*Fecha: 2025-10-24*
*Autor: Miguel Legarda*
*Commit: f825e9f*


---

## Update Readme.md
*Fecha: 2025-10-24*
*Autor: Killgreck*
*Commit: 2b85527*


---

## Update Readme.md
*Fecha: 2025-10-24*
*Autor: Killgreck*
*Commit: 2fedccc*


---

## Rename README.md to Readme.md
*Fecha: 2025-10-24*
*Autor: Killgreck*
*Commit: 54d348d*


---

## Rename README.md to Readme.md
*Fecha: 2025-10-24*
*Autor: Killgreck*
*Commit: e42acbc*


---

## Update .gitignore to protect sensitive files (AWS keys, Docker env)
*Fecha: 2025-10-24*
*Autor: Miguel Legarda*
*Commit: 2058375*


---

## Add README.md to root directory
*Fecha: 2025-10-24*
*Autor: Miguel Legarda*
*Commit: 502bf43*


---

## Delete Back/.env.example
*Fecha: 2025-10-24*
*Autor: Killgreck*
*Commit: fc69bf2*


---

## Delete Back/.env.docker
*Fecha: 2025-10-24*
*Autor: Killgreck*
*Commit: cf2bb46*


---

## Delete Back/.env
*Fecha: 2025-10-24*
*Autor: Killgreck*
*Commit: ba52ddf*


---

## feat: Add Front (Chrome Extension) and Docs directories with initial setup
*Fecha: 2025-10-23*
*Autor: Miguel Legarda*
*Commit: 27c872f*


---

## Actualización del proyecto: nuevos tests y configuración
*Fecha: 2025-10-22*
*Autor: Miguel Legarda*
*Commit: 35c06e6*


---

## Set up CI with Azure Pipelines
*Fecha: 2025-10-20*
*Autor: Killgreck*
*Commit: 87223c0*

[skip ci]
---

## Update README.md
*Fecha: 2025-10-08*
*Autor: Killgreck*
*Commit: 3e0b825*


---

## Back and test
*Fecha: 2025-10-08*
*Autor: Killgreck*
*Commit: 59b20ae*

Back and test create 69 % test passed

---
