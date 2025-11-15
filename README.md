### README – Plataforma de Apuestas P2P “jafar”

#### Descripción del Proyecto
“jafar” es una plataforma de apuestas entre pares (P2P) enfocada en ofrecer transparencia, comisiones reducidas (5%) y libertad para crear apuestas personalizadas sobre cualquier evento verificable. El objetivo MVP es alcanzar 5 000 usuarios activos mensuales y un volumen de 100 000 USD en transacciones durante los primeros 8 meses. El enfoque del desarrollo es mantener la simplicidad y asegurar que solo se construya la funcionalidad core necesaria para operar el modelo P2P sin añadir características complejas adicionales.

---

### Getting Started

This section will guide you through setting up the backend services for the Jafar platform.

#### Prerequisites

- Node.js (v18 or higher)
- npm
- Docker (for MongoDB) or a MongoDB Atlas account.

#### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd jafar
    ```

2.  **Install backend dependencies:**
    ```bash
    cd Back
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the `Back` directory and add the following variables:

    ```
    # The port the server will run on
    PORT=3000

    # The MongoDB connection string
    MONGODB_URI=mongodb://127.0.0.1:27017/jafar

    # The application environment (development, production, or test)
    APP_ENV=development
    ```

    If you are using Docker for MongoDB, you can use the default `MONGODB_URI`. If you are using MongoDB Atlas, replace the URI with your own.

---

### Usage

#### Running the application

1.  **Start the backend server:**
    ```bash
    npm run dev
    ```

    The server will start on the port specified in your `.env` file (default: 3000).

2.  **Running in production:**
    ```bash
    npm run build
    npm start
    ```

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

