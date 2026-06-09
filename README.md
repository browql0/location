# Voiture SaaS

SaaS multi-agences pour la gestion des agences de location de voitures.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma ORM

## Démarrage

```bash
npm install
cp .env.example backend/.env
cp .env.example frontend/.env
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:backend
npm run dev:frontend
```

API health check:

```txt
GET http://localhost:4000/api/v1/health
```
