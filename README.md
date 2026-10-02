# Gym Management

Sistema web de gestión para gimnasios. Permite administrar socios, membresías, pagos y asistencias desde una interfaz web, con acceso diferenciado para administradores y socios.

El proyecto cuenta con una instalación de demostración pública utilizando datos ficticios y un modo de solo lectura.

## Demo

[Ver demo](https://gym-management-demo-frontend.vercel.app)

La demo utiliza una base de datos independiente de producción y contiene únicamente datos ficticios.

Las acciones que modifican información están deshabilitadas para que el sistema pueda explorarse sin alterar los datos de la demostración.

### Credenciales de demostración

#### Administrador

Email: `demo-admin@gym.com`

Contraseña: `DemoAdmin2026!`

#### Socio

Email: `sofia.demo@gym.com`

Contraseña: `DemoSocio1-2026!`

## Funcionalidades

### Administrador

- Dashboard general
- Gestión de socios
- Creación y gestión de membresías
- Filtros y búsqueda de membresías
- Gestión de asistencias
- Gestión de pagos
- Visualización de detalles de socios
- Gestión de planes mensuales, trimestrales y anuales
- Gestión de estados de membresía
- Cancelación y renovación de membresías

### Socio

- Dashboard personal
- Visualización de membresía actual
- Consulta de pagos
- Consulta de asistencias
- Gestión del perfil
- Cambio de plan
- Cancelación y renovación de membresía

## Arquitectura

El proyecto está dividido en frontend y backend independientes.

React + TypeScript
        |
        v
      Vercel
    Frontend
        |
        v
      Vercel
     Backend
        |
        v
PostgreSQL / Supabase

La aplicación utiliza el backend como fuente de verdad para las reglas de negocio y el acceso a la base de datos.

La instalación de demostración utiliza infraestructura y datos separados de producción.

## Tecnologías

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS

### Backend

- Node.js
- TypeScript
- Express
- PostgreSQL
- pg
- JWT
- bcrypt

### Infraestructura

- Vercel
- Supabase
- PostgreSQL

## Roles

El sistema cuenta con dos roles:

- `admin`: acceso a las herramientas de administración del gimnasio.
- `member`: acceso a la información y operaciones correspondientes al socio.

El registro público crea únicamente cuentas de socio.

Las cuentas de administrador se crean mediante el proceso de administración inicial del sistema.

## Membresías

El sistema soporta tres tipos de planes:

- Mensual
- Trimestral
- Anual

Las membresías mantienen su historial y utilizan fechas correspondientes a períodos de calendario.

También se contemplan membresías futuras pendientes, cambios de plan, cancelaciones al finalizar el período y renovaciones.

## Seguridad

- Contraseñas almacenadas mediante bcrypt.
- Autenticación mediante JWT.
- Variables sensibles configuradas mediante variables de entorno.
- La base de datos no se conecta directamente desde el frontend.
- La demo utiliza una base de datos independiente de producción.
- El modo demo bloquea las operaciones de escritura tanto en frontend como en backend.

## Ejecución local

El proyecto contiene dos aplicaciones independientes:

frontend/
backend/

Las instrucciones específicas de configuración y despliegue se encuentran en `DEPLOYMENT.md`.

Las variables de entorno deben configurarse localmente y no deben incluirse en el repositorio.

## Estructura

gym-management/
├── backend/
│   ├── migrations/
│   └── src/
├── frontend/
│   ├── public/
│   └── src/
├── DEPLOYMENT.md
└── README.md

## Estado del proyecto

Proyecto funcional desplegado en producción y acompañado por una instalación de demostración independiente.

La versión de demostración está diseñada para permitir la exploración de la interfaz y funcionalidades sin modificar sus datos.
