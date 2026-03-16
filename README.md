# FuelEU Maritime Compliance Platform

A full-stack implementation of the **FuelEU Maritime** compliance module, built per EU Regulation 2023/1805 (Articles 20–21, Annex IV).

---

## Overview

This platform enables maritime operators to:

- **Track routes** and their GHG intensities
- **Compare** routes against the 2025 compliance target (89.3368 gCO₂e/MJ)
- **Bank** positive compliance balances (Article 20)
- **Pool** compliance balances across a fleet (Article 21)

---

## Screenshots

### 🚢 Routes Tab — Route Registry & Baselines
![Routes](Screenshot%202026-03-16%20144604.png)

### 📊 Compare Tab — GHG Intensity Comparison Chart
![Compare](Screenshot%202026-03-16%20144615.png)

### 🏦 Banking Tab — Article 20 Compliance Banking
![Banking](Screenshot%202026-03-16%20144626.png)

### 🏊 Pooling Tab — Article 21 Compliance Pooling
![Pooling](Screenshot%202026-03-16%20144705.png)

---

## Repository Structure
```
fueleu/
├── backend/                 # Node.js + TypeScript + PostgreSQL
│   └── src/
│       ├── core/
│       │   ├── domain/      # Entities, formulas (pure TypeScript, no frameworks)
│       │   ├── application/ # Use cases (business logic)
│       │   └── ports/       # Repository interfaces (dependency inversion)
│       ├── adapters/
│       │   ├── inbound/http/   # Express routers
│       │   └── outbound/postgres/ # PostgreSQL repository implementations
│       └── infrastructure/
│           ├── db/          # Migrations, seed, connection pool
│           └── server/      # Express app factory, entry point
├── frontend/                # React + TypeScript + TailwindCSS
│   └── src/
│       ├── core/
│       │   ├── domain/      # Types, constants (no React)
│       │   └── ports/       # Service interfaces
│       ├── adapters/
│       │   ├── ui/          # React components + hooks
│       │   └── infrastructure/ # Axios API client
│       └── shared/
├── AGENT_WORKFLOW.md        # AI agent usage documentation
├── REFLECTION.md            # Reflection essay
└── README.md
```

---

## Architecture

Both frontend and backend follow **Hexagonal Architecture (Ports & Adapters)**:
```
           ┌─────────────────────────────────┐
           │           CORE                  │
           │  domain/  application/  ports/  │
           │  (pure TypeScript, no deps)     │
           └──────────┬──────────────────────┘
                      │ depends on interfaces only
         ┌────────────┴────────────┐
         │                         │
   ┌─────▼──────┐           ┌──────▼─────┐
   │  Inbound   │           │  Outbound  │
   │  Adapters  │           │  Adapters  │
   │ (Express   │           │ (Postgres  │
   │  Routers)  │           │  Repos)    │
   └────────────┘           └────────────┘
```

**Key principle**: The `core/` directory has zero framework dependencies. Express, PostgreSQL, React, and Axios all live exclusively in adapters/infrastructure layers.

---

## Core Formulas

Per EU Regulation 2023/1805, Annex IV:

| Formula | Expression |
|---------|-----------|
| Target GHG Intensity (2025) | 89.3368 gCO₂e/MJ |
| Energy in Scope | `fuelConsumption (t) × 41,000 MJ/t` |
| Compliance Balance | `(Target − Actual) × EnergyInScope` |
| % Difference | `((comparison / baseline) − 1) × 100` |

Positive CB = **Surplus** · Negative CB = **Deficit**

---

## Setup & Run Instructions

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9
- Docker Desktop (for PostgreSQL)

---

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
# → API running at http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# → App running at http://localhost:3000
```

---

## Running Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## API Reference

### Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/routes` | All routes (supports `?vesselType=&fuelType=&year=`) |
| `POST` | `/routes/:id/baseline` | Set a route as the baseline |
| `GET` | `/routes/comparison` | Baseline vs. all other routes with compliance flags |

### Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/compliance/cb?shipId=&year=` | Compute & store compliance balance |
| `GET` | `/compliance/adjusted-cb?shipId=&year=` | CB including banked surplus |

### Banking (Article 20)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/banking/records?shipId=&year=` | — | Bank transaction history |
| `POST` | `/banking/bank` | `{ shipId, year, amount }` | Bank positive CB |
| `POST` | `/banking/apply` | `{ shipId, year, amount }` | Apply banked surplus |

### Pooling (Article 21)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/pools` | `{ year, members: [{shipId}] }` | Create compliance pool |
| `GET` | `/pools/:poolId` | — | Retrieve pool details |

---

## Seed Data

| routeId | vesselType | fuelType | year | ghgIntensity | fuelConsumption (t) | distance (km) |
|---------|-----------|----------|------|-------------|---------------------|--------------|
| R001 | Container | HFO | 2024 | 91.0 | 5000 | 12000 |
| R002 | BulkCarrier | LNG | 2024 | 88.0 | 4800 | 11500 |
| R003 | Tanker | MGO | 2024 | 93.5 | 5100 | 12500 |
| R004 | RoRo | HFO | 2025 | 89.2 | 4900 | 11800 |
| R005 | Container | LNG | 2025 | 90.5 | 4950 | 11900 |

R001 is seeded as the default baseline.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Frontend styling | TailwindCSS 3 |
| Frontend charts | Recharts |
| Frontend HTTP | Axios |
| Backend framework | Express 4 + TypeScript |
| Database | PostgreSQL 14+ |
| Backend DB client | pg (node-postgres) |
| Testing (backend) | Jest + ts-jest |
| Testing (frontend) | React Testing Library + Jest |

---

## Reference

All formulas, constants, and business rules follow:
**FuelEU Maritime Regulation (EU) 2023/1805**, Annex IV and Articles 20–21.
```

Then commit with message:
```
docs: add screenshots to README
