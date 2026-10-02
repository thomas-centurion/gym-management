# Gym Management

Sistema web de gestión para gimnasios. Permite administrar socios, membresías, pagos y asistencias desde una interfaz web, con acceso diferenciado para administradores y socios.

El proyecto cuenta con una instalación de demostración pública utilizando datos ficticios y un modo de solo lectura.

## Demo

Demo pública:

https://gym-management-frontend-xi.vercel.app

La demo utiliza una base de datos independiente de producción y contiene únicamente datos ficticios.

Las acciones que modifican información están deshabilitadas para que el sistema pueda explorarse sin alterar los datos de la demostración.

### Credenciales de demostración

#### Administrador

Email:

`demo-admin@gym.com`

Contraseña:

`DemoAdmin2026!`

#### Socio

Email:

`sofia.demo@gym.com`

Contraseña:

`DemoSocio1-2026!`

El usuario administrador permite explorar el dashboard y las herramientas de gestión.

El usuario socio permite explorar la experiencia correspondiente a un miembro del gimnasio.

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

```text
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
