# 💰 Sistema de Control de Gastos Personales

> Proyecto full-stack para la gestión financiera personal de asociados — Cooperativa de Ahorro

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](http://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

---

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Modelo de Datos](#-modelo-de-datos)
- [Plan de Releases](#-plan-de-releases)
- [Sprints e Historias de Usuario](#-sprints-e-historias-de-usuario)
- [Cronograma](#-cronograma)
- [Definition of Done (DoD)](#-definition-of-done-dod)
- [Tablero Kanban](#-tablero-kanban)
- [Instalación y Ejecución](#-instalación-y-ejecución)

---

## 📖 Descripción del Proyecto

El **Sistema de Control de Gastos Personales** es una aplicación web full-stack que permite a los asociados de una cooperativa de ahorro registrar y controlar sus finanzas personales: gestión de usuarios, categorías de ingreso y gasto, registro de transacciones, definición de presupuestos mensuales, consulta de resúmenes financieros y generación de alertas automáticas.

### Alcance

| Aspecto | Detalle |
|---|---|
| **Tipo** | Aplicación Web — Cooperativa de Ahorro |
| **Entidades** | 6 entidades con relaciones (ver modelo de datos) |
| **Historias de Usuario** | 11 HUs organizadas en 5 sprints |
| **Releases** | 2 releases alineados con los cortes del proyecto |
| **Casos de Uso** | 5 CUs (registro, categorías, transacciones, presupuestos, resumen) |

### Funcionalidades Principales

- ✅ Registro y autenticación de usuarios con JWT
- ✅ CRUD completo de Categorías personalizadas (ingreso/egreso) por usuario
- ✅ Registro de Transacciones con clasificación por tipo, categoría y período
- ✅ Gestión de Períodos Mensuales con control de estado (activo/inactivo)
- ✅ Definición de Presupuestos mensuales por categoría con unicidad compuesta
- ✅ Cálculo automático de porcentaje de uso y alertas visuales (verde / amarillo / rojo)
- ✅ Resumen financiero mensual con balance neto y desglose por categoría
- ✅ Common Module: Filtros de excepción, Interceptores y Pipes globales
- ✅ Integración completa Frontend ↔ Backend con Docker Compose

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Backend** | NestJS (Node.js + TypeScript) | API REST con arquitectura en capas |
| **Frontend** | Next.js 14+ (React + TypeScript) | Interfaz de usuario con App Router |
| **Base de Datos** | PostgreSQL 16 | Almacenamiento relacional |
| **ORM** | Prisma | Modelado de datos, migraciones y queries |
| **Contenedores** | Docker + Docker Compose | Orquestación de servicios |
| **Validación** | class-validator + class-transformer | DTOs y validación de entrada |

---

## 🏗 Arquitectura

El proyecto sigue una **arquitectura en capas** con separación de responsabilidades:

```
Cliente HTTP → Controller (valida DTO + ruta) → Service (lógica de negocio) → Repository (acceso a datos) → Prisma / PostgreSQL
```

### Estructura del Proyecto

```
proyecto/
├── docker-compose.yml
├── .env.example
├── backend/                        # API REST con NestJS
│   ├── Dockerfile
│   ├── src/
│   │   ├── common/                 # Módulo compartido (cross-cutting)
│   │   │   ├── filters/            # Filtros de excepción globales
│   │   │   ├── interceptors/       # Interceptores de respuesta
│   │   │   ├── pipes/              # Pipes de validación
│   │   │   └── guards/             # Guards de autenticación JWT
│   │   ├── auth/                   # Módulo de autenticación (JWT + Passport)
│   │   ├── prisma/                 # Módulo Prisma (acceso a BD)
│   │   └── modules/                # Módulos de dominio
│   │       └── [entidad]/
│   │           ├── controller/     # Solo manejo HTTP
│   │           ├── service/        # Lógica de negocio
│   │           ├── repository/     # Acceso a datos (Prisma)
│   │           ├── dto/            # Validación de entrada
│   │           └── entities/       # Representación del dominio
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.ts                 # Seed de TipoTransaccion
│       └── migrations/
│
├── frontend/                       # Interfaz con Next.js
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/                    # App Router (páginas)
│   │   ├── components/             # Componentes reutilizables
│   │   ├── services/               # Capa de acceso a la API
│   │   ├── interfaces/             # Tipos e interfaces TypeScript
│   │   ├── context/                # AuthContext y estado global
│   │   └── lib/                    # Utilidades y cliente HTTP (api.ts)
│   └── package.json
│
└── README.md
```

---

## 📊 Modelo de Datos

### Diagrama de Relaciones

```
Usuario             1 ──── N  Transaccion
Usuario             1 ──── N  Presupuesto
Usuario             1 ──── N  Categoria
Categoria           1 ──── N  Transaccion
Categoria           1 ──── N  Presupuesto
TipoTransaccion     1 ──── N  Transaccion
Periodo             1 ──── N  Transaccion
Periodo             1 ──── N  Presupuesto
```

### Entidades

| Entidad | Campos Principales |
|---|---|
| **Usuario** | id, nombres, apellidos, correoElectronico (unique), passwordHash, fechaNacimiento, monedaPreferida |
| **Categoria** | id, nombre (unique por usuario), descripcion, tipo (INGRESO/EGRESO), icono, usuarioId |
| **TipoTransaccion** | id, nombre (unique): INGRESO \| EGRESO, descripcion |
| **Periodo** | id, nombre (unique), fechaInicio, fechaFin, activo (boolean) |
| **Transaccion** | id, monto, fecha, descripcion, usuarioId, categoriaId, periodoId, tipoTransaccionId |
| **Presupuesto** | id, montoLimite, usuarioId, categoriaId, periodoId (unique compound: usuarioId + categoriaId + periodoId) |

---

## 🚀 Plan de Releases

### Release 1 — Primer Corte: Backend + Frontend Base

> **📅 Cierre: Semana 6** · Sprints 1, 2 y 3

**Objetivo:** Entregar la API REST completa con arquitectura en capas (Controller → Service → Repository) y el frontend con las vistas de CRUD para todas las entidades base del sistema financiero.

| Sprint | Período | HUs | Alcance |
|---|---|---|---|
| [Sprint 1](#sprint-1--infraestructura-y-entidades-base) | Semanas 1–2 | HU-01, HU-02, HU-03 | Docker, Prisma, Usuario, Categoría, TipoTransaccion |
| [Sprint 2](#sprint-2--transacciones-y-cross-cutting) | Semanas 3–4 | HU-04, HU-05, HU-06 | Transaccion, Periodo, Presupuesto, Common Module |
| [Sprint 3](#sprint-3--presupuestos-frontend-base-y-autenticación) | Semanas 5–6 | HU-07, HU-08, HU-09 | Resumen financiero, Auth JWT, Frontend base |

### Release 2 — Segundo Corte: Integración y Despliegue

> **📅 Cierre: Semana 10** · Sprints 4 y 5

**Objetivo:** Integración completa frontend ↔ backend, dashboard financiero con alertas visuales, formularios avanzados con relaciones y despliegue funcional con Docker.

| Sprint | Período | HUs | Alcance |
|---|---|---|---|
| [Sprint 4](#sprint-4--frontend-avanzado-e-integración) | Semanas 7–8 | HU-10 | Dashboard, listados, formularios, navegación y alertas |
| [Sprint 5](#sprint-5--cierre-y-despliegue) | Semanas 9–10 | HU-11 | Integración de flujos, pruebas, Docker Compose, README |

---

## 📌 Sprints e Historias de Usuario

### Sprint 1 — Infraestructura y entidades base

> 📅 **Semanas 1–2** · <!-- TODO: Agregar enlace al Milestone en GitHub -->

| # | Historia de Usuario | Labels | Issue |
|---|---|---|---|
| HU-01 | Gestión de Usuarios | `user-story` `backend` `frontend` `core` | <!-- TODO --> |
| HU-02 | Gestión de Categorías | `user-story` `backend` `frontend` `core` | <!-- TODO --> |
| HU-03 | Gestión de Tipos de Transacción y Períodos | `user-story` `backend` `frontend` `core` | <!-- TODO --> |

**Entregables:**
- Docker Compose con PostgreSQL, NestJS y Next.js
- Prisma schema con entidades Usuario, Categoria y TipoTransaccion
- Seed de TipoTransaccion (INGRESO / EGRESO)
- Migraciones ejecutadas
- CRUD completo (Controller → Service → Repository) para Usuario y Categoria
- Frontend: listados y formularios básicos

---

### Sprint 2 — Transacciones y cross-cutting

> 📅 **Semanas 3–4** · <!-- TODO: Agregar enlace al Milestone en GitHub -->

| # | Historia de Usuario | Labels | Issue |
|---|---|---|---|
| HU-04 | Registro de Transacciones | `user-story` `backend` `frontend` `core` | <!-- TODO --> |
| HU-05 | Gestión de Presupuestos Mensuales | `user-story` `backend` `frontend` `core` | <!-- TODO --> |
| HU-06 | Comparación Presupuesto vs. Gastos y Alertas | `user-story` `backend` `frontend` `dashboard` | <!-- TODO --> |

**Entregables:**
- CRUD de Transaccion con validación de coherencia tipo-categoría
- CRUD de Periodo con lógica de período activo único
- CRUD de Presupuesto con validación de unicidad compuesta
- Endpoint `GET /presupuestos/estado/:periodoId` con cálculo de porcentaje de uso y alertas
- Common module: Filters, Interceptors, Pipes

---

### Sprint 3 — Presupuestos, Frontend base y Autenticación

> 📅 **Semanas 5–6** · 📝 Cierre Primer Corte: Semana 6 · <!-- TODO: Agregar enlace al Milestone en GitHub -->

| # | Historia de Usuario | Labels | Issue |
|---|---|---|---|
| HU-07 | Resumen Financiero Mensual | `user-story` `backend` `frontend` `dashboard` | <!-- TODO --> |
| HU-08 | Common Module: Filtros, Interceptores y Pipes | `user-story` `backend` `core` | <!-- TODO --> |
| HU-09 | Autenticación de Usuarios con JWT | `user-story` `backend` `frontend` `auth` | <!-- TODO --> |

**Entregables:**
- Endpoint `GET /resumen/:periodoId` con totales agregados, balance neto y desglose por categoría
- Common Module global (filtros de excepción, interceptores de respuesta, pipes de validación)
- AuthModule con JwtStrategy, PassportJS y decorador `@CurrentUser()`
- Frontend: estructura Next.js, AuthContext, middleware de protección de rutas, listados y formularios de entidades base

---

### Sprint 4 — Frontend avanzado e integración

> 📅 **Semanas 7–8** · <!-- TODO: Agregar enlace al Milestone en GitHub -->

| # | Historia de Usuario | Labels | Issue |
|---|---|---|---|
| HU-10 | Frontend: Dashboard, Formularios y Navegación | `user-story` `frontend` `dashboard` | <!-- TODO --> |

**Entregables:**
- Formularios con selects dinámicos encadenados (tipo → categoría → período)
- Dashboard con resumen del período activo y alertas de presupuesto por categoría
- Layout general con sidebar/navbar y navegación entre secciones
- Diseño responsivo (desktop + tablet)
- Componentes de feedback (toast/alert de éxito/error)

---

### Sprint 5 — Cierre y despliegue

> 📅 **Semanas 9–10** · 📝 Cierre Segundo Corte: Semana 10 · <!-- TODO: Agregar enlace al Milestone en GitHub -->

| # | Historia de Usuario | Labels | Issue |
|---|---|---|---|
| HU-11 | Integración Final y Despliegue con Docker | `user-story` `infrastructure` `integration` | <!-- TODO --> |

**Entregables:**
- Integración de flujos completos (registrar usuario → crear categoría → registrar transacción → definir presupuesto → consultar resumen)
- Pruebas de integración
- Docker Compose validación final con healthchecks
- README y documentación

---

## 📅 Cronograma

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    PRIMER CORTE (Release 1) — Cierre: Semana 6              │
│                          Backend + Frontend Base                            │
├─────────────────────┬─────────────────────┬──────────────────────────────────┤
│  Sprint 1           │    Sprint 2         │         Sprint 3                │
│  Semanas 1–2        │  Semanas 3–4        │       Semanas 5–6               │
│                     │                     │                                 │
│ • Docker + Prisma   │ • Transaccion       │ • Resumen financiero            │
│ • Usuario           │ • Periodo           │ • Auth JWT                      │
│ • Categoría         │ • Presupuesto       │ • Common Module                 │
│ • TipoTransaccion   │ • Alertas uso       │ • Frontend: listados y forms    │
│   (seed)            │ • Filters/Pipes     │                                 │
│                     │                     │                                 │
│ Según calendario    │ Según calendario    │                                 │
├─────────────────────┴─────────────────────┴──────────────────────────────────┤
│                    SEGUNDO CORTE (Release 2) — Cierre: Semana 10            │
│                          Integración y Despliegue                           │
├────────────────────────────────────┬─────────────────────────────────────────┤
│        Sprint 4                    │          Sprint 5                      │
│        Semanas 7–8                 │          Semanas 9–10                  │
│                                    │                                        │
│ • Dashboard financiero             │ • Integración de flujos               │
│ • Frontend formularios             │ • Pruebas de integración              │
│ • Navegación y layout              │ • Docker Compose validación           │
│ • Selects dinámicos                │ • README y documentación              │
│ • Alertas visuales                 │                                        │
│                                    │                                        │
│ Según calendario                   │ Según calendario                      │
└────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## ✅ Definition of Done (DoD)

> 📌 Referencia completa: <!-- TODO: Agregar enlace al Issue de DoD en GitHub -->

Cada Historia de Usuario se considera **terminada** cuando cumple **todos** los siguientes criterios:

### Backend
- [ ] Endpoint(s) implementados con arquitectura en capas: Controller → Service → Repository
- [ ] DTOs con validaciones usando `class-validator` y `class-transformer`
- [ ] Manejo de errores con excepciones HTTP apropiadas (`NotFoundException`, `ConflictException`, `BadRequestException`)
- [ ] Respuestas con formato uniforme (interceptor aplicado)
- [ ] Endpoint probado manualmente con Postman/Thunder Client

### Frontend
- [ ] Página(s) implementada(s) con componentes reutilizables
- [ ] Consumo del API a través de la capa de `services/`
- [ ] Manejo de estados: carga (loading), éxito y error
- [ ] Formularios con validación del lado del cliente
- [ ] Diseño responsivo y navegable

### Infraestructura y Código
- [ ] Código versionado en GitHub con commits descriptivos
- [ ] El servicio funciona correctamente con `docker compose up`
- [ ] No hay errores de consola ni advertencias críticas
- [ ] Las migraciones de Prisma están aplicadas y el esquema es consistente

---

## 📊 Tablero Kanban

El seguimiento del proyecto se realiza mediante un tablero Kanban en GitHub Projects:

🔗 <!-- TODO: Agregar enlace al Tablero Kanban en GitHub Projects -->

El tablero incluye:
- **Columnas:** Todo → In Progress → Done
- **Campos personalizados:** Sprint, Release, Prioridad
- **Vistas:** Board (Kanban), Table, Roadmap

---

## ⚙ Instalación y Ejecución

### Prerrequisitos

- [Docker](https://www.docker.com/products/docker-desktop/) y Docker Compose instalados
- [Git](https://git-scm.com/downloads)

### Clonar el repositorio

```bash
git clone https://github.com/cooperativa/control-gastos-sistema.git
cd control-gastos-sistema
```

### Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

```env
# .env.example
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=control_gastos_db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
```

### Levantar los servicios

```bash
# Levantar todos los servicios con Docker Compose
docker compose up

# O en modo detached (segundo plano)
docker compose up -d
```

### Acceder a los servicios

| Servicio | URL |
|---|---|
| **Frontend (Next.js)** | [http://localhost:3000](http://localhost:3000) |
| **Backend (NestJS API)** | [http://localhost:3001](http://localhost:3001) |
| **PostgreSQL** | `localhost:5432` |

### Ejecutar migraciones y seed de Prisma

```bash
# Entrar al contenedor del backend
docker compose exec backend sh

# Ejecutar migraciones
npx prisma migrate dev

# Generar el cliente Prisma
npx prisma generate

# Ejecutar el seed (TipoTransaccion: INGRESO / EGRESO)
npx prisma db seed
```

---

## 📎 Enlaces Rápidos

| Recurso | Enlace |
|---|---|
| 📋 Tablero Kanban | <!-- TODO: Agregar enlace --> |
| 📌 Issues (todos) | [Ver Issues](https://github.com/casalas-2024a-cell/Sistema-de-Control-de-Gastos-Personales-/issues) |
| 🏁 Sprint 1 | [<!-- TODO: Agregar Milestone -->]|
| 🏁 Sprint 2 | <!-- TODO: Agregar Milestone --> |
| 🏁 Sprint 3 | <!-- TODO: Agregar Milestone --> |
| 🏁 Sprint 4 | <!-- TODO: Agregar Milestone --> |
| 🏁 Sprint 5 | <!-- TODO: Agregar Milestone --> |
| 📖 Definition of Done | <!-- TODO: Agregar Issue --> |

---

<p align="center">
  <strong>Sistema de Control de Gastos Personales — Cooperativa de Ahorro</strong><br>
  <em>Herramienta digital para el bienestar financiero de los asociados</em>
</p>
