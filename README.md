#### Running tests

-   **Run all tests:**
    ```bash
    npm test
    ```

-   **Run tests in watch mode:**
    ```bash
    npm run test:watch
    ```

-   **View test coverage:**
    ```bash
    npm run test:coverage
    ```

---

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

