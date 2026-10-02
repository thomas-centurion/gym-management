# Preparación para Vercel

## Inicializar PostgreSQL nueva

`backend/migrations/001_initial_schema.sql` es el esquema inicial sin datos, versionado a partir del dump estructural `gym-management-schema.sql`. Crea las tablas `users`, `memberships`, `payments` y `attendances`, sus sequences/defaults de ID, claves y constraints, el índice parcial de membresía actual, y las claves foráneas con sus acciones existentes. No contiene ownership del usuario local `postgres` ni datos.

Aplicarlo únicamente a una base PostgreSQL vacía. El comando ejecuta el archivo en una transacción y aborta si falla:

```sh
cd backend
npm ci
npm run db:init
```

`DATABASE_URL` debe estar disponible en el entorno de ese proceso. No usar `migrate:membership-calendar` para inicializar la base: ese comando es una migración de datos. `db:init` no es un mecanismo de actualización/reaplicación y debe ejecutarse una sola vez por base nueva.

## Secuencia de producción

1. Crear una base PostgreSQL vacía en el proveedor elegido.
2. Configurar `DATABASE_URL` en el entorno donde se ejecutará el inicializador y en el proyecto backend de Vercel.
3. Aplicar el esquema inicial desde `backend` con `npm run db:init`.
4. Configurar `JWT_SECRET` en el proyecto backend.
5. Configurar `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno donde se ejecutará el seed.
6. Ejecutar `npm run seed:admin` desde `backend` una sola vez.
7. Configurar `FRONTEND_ORIGIN` en backend con el origen del frontend (sin rutas). Se puede indicar más de uno, separado por comas. Si queda vacío, CORS mantiene el comportamiento permisivo actual.
8. Desplegar el backend en Vercel.
9. Configurar `VITE_API_URL` en frontend con la URL pública del backend terminada en `/api` y reconstruir frontend.
10. Desplegar el frontend en Vercel.

## Proyectos Vercel

Configurar dos proyectos desde este repositorio:

- Frontend: Root Directory `frontend`, preset Vite, build `npm run build`, output `dist`, Node `22.x`.
- Backend: Root Directory `backend`, preset Express, Node `22.x`. `src/app.ts` exporta la aplicación Express para Vercel. `src/server.ts` permanece como servidor local y utiliza `PORT` o el puerto `3000` por defecto.

El frontend utiliza BrowserRouter; `frontend/vercel.json` reescribe las rutas SPA a `index.html`. Los endpoints del backend conservan el prefijo `/api`.

## Variables de entorno

Configurar en el proyecto backend:

- `DATABASE_URL`: URL de conexión PostgreSQL.
- `JWT_SECRET`: clave de firma JWT.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: necesarios para crear el administrador inicial con el seed.
- `FRONTEND_ORIGIN`: opcional. Si se configura, admite uno o varios orígenes, separados por coma, sin rutas. Si queda vacío, CORS mantiene su comportamiento permisivo actual para desarrollo.

Configurar en el proyecto frontend:

- `VITE_API_URL`: URL base pública del backend terminada en `/api`. Vite la incluye en el bundle; no debe contener secretos.

No copiar secretos a archivos versionados ni al bundle frontend.

## Comandos

Validar frontend:

```sh
cd frontend
npm ci
npm run lint
npm run build
```

Validar backend:

```sh
cd backend
npm ci
npm run build
```

Tras enlazar cada carpeta con su proyecto Vercel y configurar las variables, el despliegue se puede iniciar desde cada Root Directory con `vercel --prod`. No se ejecutó ningún deploy.
