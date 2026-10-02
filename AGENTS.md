# AGENTS.md

## Proyecto

Este repositorio contiene `gym-management`, un sistema de gestión de gimnasio.

La estructura principal es:

- `backend/`: API REST con TypeScript, Node.js, Express y PostgreSQL.
- `frontend/`: React + TypeScript + Vite + Tailwind CSS.

## Regla principal

El código existente y los contratos reales del backend son la fuente de verdad.

NO inventar:

- endpoints;
- campos;
- respuestas;
- roles;
- estados;
- reglas de negocio;
- credenciales;
- funcionalidades.

Si algo no está definido en el código, buscar primero en el repositorio.

Si después de revisar el código algo realmente no está definido, indicarlo claramente en lugar de asumir.

## Antes de modificar código

Siempre:

1. Inspeccionar el repositorio.
2. Entender la arquitectura.
3. Revisar los `package.json`.
4. Revisar backend y frontend.
5. Revisar rutas y contratos de API.
6. Identificar funcionalidades existentes.
7. Detectar inconsistencias antes de corregirlas.

No modificar código a ciegas.

## Backend

El backend utiliza:

- TypeScript;
- Node.js;
- Express;
- PostgreSQL;
- JWT;
- bcrypt.

Los roles son:

- `admin`;
- `member`.

El registro público crea solamente usuarios `member`.

El backend controla las reglas de negocio.

No modificar las reglas del backend solamente para facilitar el frontend.

## Membresías

Los planes existentes son:

- `monthly`;
- `quarterly`;
- `annual`.

Los estados existentes son:

- `active`;
- `pending`.

Campos importantes:

- `id`;
- `user_id`;
- `plan`;
- `start_date`;
- `end_date`;
- `status`;
- `next_plan`;
- `cancel_at_end`;
- `is_current`.

La membresía actual se determina mediante `is_current`.

El sistema contempla:

- membresía actual;
- cambios de plan;
- cambios de plan pendientes;
- cancelación al finalizar;
- deshacer cancelación;
- renovaciones;
- pagos simulados;
- historial de membresías.

El frontend debe respetar estas reglas.

## Pagos

Los pagos son simulados/demo.

No integrar gateways reales como Mercado Pago, Stripe o PayPal.

Utilizar únicamente los endpoints existentes del backend.

## Asistencias

El backend controla las validaciones de asistencia.

El frontend debe contemplar:

- loading;
- éxito;
- errores;
- estados vacíos.

## Frontend

El frontend utiliza:

- React;
- TypeScript;
- Vite;
- React Router;
- Tailwind CSS v4.

Mantener separación entre:

- páginas;
- componentes;
- servicios;
- context;
- hooks;
- layouts;
- tipos.

Los requests HTTP deben mantenerse en `services/` cuando corresponda.

## Calidad

Priorizar:

- TypeScript correctamente tipado;
- componentes reutilizables;
- código simple;
- nombres claros;
- manejo de errores;
- loading states;
- empty states;
- responsive;
- accesibilidad básica;
- evitar duplicación.

No agregar dependencias innecesarias.

No introducir Redux u otro state manager global sin una necesidad real.

## Diseño

La interfaz debe ser:

- limpia;
- moderna;
- consistente;
- responsive;
- clara.

Utilizar Tailwind CSS.

No reemplazar Tailwind por otra solución de estilos sin una razón concreta.

## Seguridad

Nunca:

- hardcodear JWT;
- hardcodear contraseñas;
- exponer secretos;
- subir `.env`;
- exponer `DATABASE_URL`;
- exponer `JWT_SECRET`;
- modificar `.gitignore` para incluir secretos.

## Cambios destructivos

No:

- resetear Git;
- ejecutar `git clean`;
- borrar migraciones;
- borrar funcionalidades sin justificar;
- reemplazar toda la arquitectura sin necesidad;
- modificar credenciales.

Antes de un cambio destructivo, analizar referencias y explicar el motivo.

## Verificación

Después de realizar cambios en frontend, ejecutar los scripts reales definidos en `frontend/package.json`.

Como mínimo, cuando existan:

- lint;
- build.

Si se modifica el backend, ejecutar también los scripts correspondientes definidos en `backend/package.json`.

No asumir nombres de scripts.

## Regla de implementación

Implementar funcionalidades completas y coherentes.

Evitar dejar código a medio hacer.

Reutilizar funcionalidades existentes cuando sea correcto.

No duplicar lógica que ya existe.

## Comunicación

Al finalizar una tanda de trabajo:

- indicar qué se modificó;
- indicar qué archivos fueron modificados;
- indicar qué verificaciones se ejecutaron;
- indicar qué errores quedaron;
- indicar qué funcionalidades faltan.

Nunca afirmar que algo fue probado si no fue ejecutado.

Nunca afirmar que el proyecto está terminado si todavía existen funcionalidades pendientes.

## Regla final

NO INVENTAR.

Primero inspeccionar.

Después entender.

Después modificar.

Después verificar.