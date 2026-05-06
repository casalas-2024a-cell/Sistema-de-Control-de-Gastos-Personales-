# 💰 Sistema de Control de Gastos Personales

Sistema web para la gestión integral de finanzas personales, desarrollado como proyecto académico de la cooperativa. Permite registrar transacciones, categorizar gastos, definir presupuestos con alertas automáticas, y consultar resúmenes financieros a través de un dashboard interactivo.

---

## 📋 Tecnologías Utilizadas

| Capa | Tecnología |
|------|-----------|
| **Backend** | NestJS (Node.js + TypeScript) |
| **Base de datos** | PostgreSQL 15 + Prisma ORM |
| **Frontend** | React 18 + Vite + TypeScript |
| **Autenticación** | JWT (JSON Web Tokens) |
| **Gráficos** | Recharts |
| **Infraestructura** | Docker + Docker Compose |
| **Servidor estático** | Nginx (producción) |

---

## 🏗️ Arquitectura

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend API    │────▶│  PostgreSQL   │
│  React/Vite  │     │    NestJS        │     │   (Prisma)    │
│  (nginx:80)  │     │  (port 3000)     │     │  (port 5432)  │
└─────────────┘     └──────────────────┘     └──────────────┘
```

**Backend:** Arquitectura en capas → Controller → Service → Repository (Prisma).  
**Frontend:** SPA con React Router, AuthContext global, y cliente HTTP centralizado (`lib/api.ts`).

---

## 🚀 Instalación y Ejecución

### Opción 1: Docker Compose (recomendada)

> Requisitos: Docker y Docker Compose instalados.

```bash
# 1. Clonar el repositorio
git clone https://github.com/casalas-2024a-cell/Sistema-de-Control-de-Gastos-Personales-.git
cd Sistema-de-Control-de-Gastos-Personales-

# 2. Levantar los 3 servicios con un solo comando
docker compose up --build -d

# 3. Verificar que los contenedores estén corriendo
docker ps
```

Los servicios estarán disponibles en:

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000/api/v1 |
| **PostgreSQL** | localhost:5432 |

Las migraciones de Prisma y los datos semilla se aplican automáticamente al iniciar el contenedor del backend.

### Opción 2: Desarrollo Local (manual)

> Requisitos: Node.js 20+, PostgreSQL 15+ corriendo localmente.

```bash
# 1. Configurar variables de entorno
cp .env.example backend/.env
# Editar backend/.env con tus datos de conexión a PostgreSQL

# 2. Backend
cd backend
npm install
npx prisma migrate dev     # Aplica migraciones
npx prisma db seed         # Inserta datos iniciales
npm run start:dev          # Inicia en modo desarrollo (port 3000)

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run dev                # Inicia Vite dev server (port 5173)
```

---

## 📁 Estructura del Proyecto

```
├── backend/
│   ├── src/
│   │   ├── auth/           # HU-09: Autenticación JWT
│   │   ├── categoria/      # HU-02: Gestión de categorías
│   │   ├── common/         # HU-08: Interceptores y filtros globales
│   │   ├── dashboard/      # HU-07: Resumen financiero
│   │   ├── periodo/        # HU-03: Períodos contables
│   │   ├── presupuesto/    # HU-05/HU-06: Presupuestos y alertas
│   │   ├── prisma/         # Servicio de base de datos
│   │   ├── transaccion/    # HU-04: Transacciones CRUD
│   │   ├── tipo-transaccion/
│   │   └── usuario/        # HU-01: Gestión de usuarios
│   ├── prisma/
│   │   ├── schema.prisma   # Esquema de BD
│   │   ├── migrations/     # Migraciones SQL
│   │   └── seed.ts         # Datos iniciales
│   ├── test/               # Tests E2E
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── context/        # AuthContext (JWT global)
│   │   ├── lib/            # Cliente HTTP centralizado
│   │   └── pages/          # Páginas de la app
│   │       ├── Auth/
│   │       ├── Dashboard/
│   │       ├── Categorias/
│   │       ├── Periodos/
│   │       ├── Transacciones/
│   │       ├── Presupuestos/
│   │       └── Resumen/
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔐 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://postgres:secret_password@localhost:5432/expense_db` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `mi_secreto_seguro_123` |
| `PORT` | Puerto del backend | `3000` |
| `VITE_API_URL` | URL del API para el frontend | `http://localhost:3000/api/v1` |

---

## 📊 Historias de Usuario Implementadas

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-01 | Gestión de Usuarios (CRUD) | ✅ |
| HU-02 | Gestión de Categorías | ✅ |
| HU-03 | Períodos Contables y Tipos de Transacción | ✅ |
| HU-04 | Registro de Transacciones | ✅ |
| HU-05 | Definición de Presupuestos | ✅ |
| HU-06 | Alertas de Presupuesto (80% y 100%) | ✅ |
| HU-07 | Dashboard y Resumen Financiero | ✅ |
| HU-08 | Respuestas Uniformes y Manejo de Errores | ✅ |
| HU-09 | Autenticación JWT | ✅ |
| HU-10 | Frontend: Dashboard, Formularios y Navegación | ✅ |
| HU-11 | Integración Final y Despliegue Docker | ✅ |

---

## 🧪 Tests

```bash
# Tests E2E del backend (requiere BD corriendo)
cd backend
npm run test:e2e
```

Los tests E2E validan el flujo completo: registro → login → categoría → transacción → presupuesto → resumen financiero.

---

## 👥 Equipo

Proyecto académico — Cooperativa de Desarrollo de Software 2024A.
