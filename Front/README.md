# Frontend JAFAR - Plataforma de Apuestas P2P

Frontend desarrollado con React + TypeScript + Vite para la plataforma de apuestas P2P JAFAR.

## Stack Tecnológico

- **React** con TypeScript
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP

## Instalación

```bash
npm install
```

## Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
VITE_API_URL=http://localhost:3000/api
```

## Desarrollo

```bash
npm run dev
```

El servidor de desarrollo se iniciará en `http://localhost:5173`

## Build

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables
├── contexts/        # Contextos de React (Auth, etc.)
├── pages/          # Páginas de la aplicación
├── services/       # Servicios de API
├── types/          # Tipos TypeScript
└── utils/          # Utilidades
```

## Características Implementadas

- Autenticación (Login/Registro)
- Dashboard de usuario
- Rutas protegidas
- Integración con API backend
- Diseño responsivo con Tailwind CSS
