# 🚗 VoitureSaaS

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-In%20Development-orange?style=for-the-badge)
![License](https://img.shields.io/badge/license-Private-red?style=for-the-badge)
![Market](https://img.shields.io/badge/market-Maroc%20🇲🇦-green?style=for-the-badge)

**Plateforme SaaS multi-agences de location de voitures — Marché Marocain**

[📋 Cahier des Charges](#-documentation) • [🗺️ Roadmap](#️-roadmap) • [🛠️ Stack](#️-stack-technique) • [🚀 Démarrage rapide](#-démarrage-rapide)

</div>

---

## 📖 À propos

VoitureSaaS est une plateforme cloud **multi-tenant** conçue pour digitaliser et automatiser la gestion des agences de location de voitures au Maroc.

### Objectifs
- **Gestion complète** : véhicules, clients, réservations, contrats, factures
- **Architecture multi-tenant** : isolation stricte entre agences
- **Modèle SaaS** : abonnements (Free Trial / Basic / Pro / Enterprise)
- **Réseau partagé** : blacklist et score de confiance inter-agences
- **Scalabilité** : conçu pour 500+ agences, 100 000+ réservations

---

## 🛠️ Stack Technique

### Frontend
| Technologie | Usage |
|-------------|-------|
| React + Vite + TypeScript | Framework UI |
| Tailwind CSS + shadcn/ui | Design system |
| React Router | Navigation |
| React Hook Form + Zod | Formulaires & validation |
| TanStack Table | Tables avancées |
| Recharts | Graphiques |
| FullCalendar | Calendrier réservations |
| Axios | HTTP client |
| Sonner | Notifications toast |

### Backend
| Technologie | Usage |
|-------------|-------|
| Node.js + Express + TypeScript | Serveur API REST |
| PostgreSQL | Base de données principale |
| Prisma ORM | Accès données |
| JWT + Refresh Tokens | Authentification |
| Bcrypt / Argon2 | Hashage mots de passe |
| Zod | Validation schémas |

### Infrastructure
| Technologie | Usage |
|-------------|-------|
| Docker | Containerisation |
| Cloudflare R2 / AWS S3 | Stockage fichiers & documents |
| Resend | Emails transactionnels |
| Redis + BullMQ | Jobs asynchrones *(futur)* |

---

## 👥 Rôles & Permissions

```
SUPER_ADMIN
├── Gestion plateforme SaaS (agences, plans, abonnements)
├── Statistiques globales
└── Validation incidents & blacklist

AGENCY_ADMIN
├── Gestion agence (voitures, clients, staff)
├── Réservations, factures, contrats
└── Incidents & configuration

STAFF
├── Réservations
├── Clients
└── Véhicules (consultation)
```

---

## 🗺️ Roadmap

| Phase | Fonctionnalité | Statut |
|-------|----------------|--------|
| **Phase 1** | Fondation Technique (monorepo, Prisma, Docker) | ✅ Terminé |
| **Phase 2** | Authentification & Multi-Tenant (JWT, guards, middlewares) | ✅ Terminé |
| **Phase 3** | Agences & Abonnements SaaS | ✅ Terminé |
| **Phase 4** | Gestion Staff & Audit Logs | Gestion staff ✅ Terminé |
| **Phase 5** | Gestion Véhicules (CRUD, états, documents, alertes) | 🔄 À faire |
| **Phase 6** | Gestion Clients (fiche, documents CIN/permis) | 🔄 À faire |
| **Phase 7** | Réservations (calendrier, disponibilité, anti-chevauchement) | 🔄 À faire |
| **Phase 8** | Paiements & Cautions | 🔄 À faire |
| **Phase 9** | Contrats PDF automatisés | 🔄 À faire |
| **Phase 10** | Factures PDF (INV-2026-XXXX) | 🔄 À faire |
| **Phase 11** | Gestion Dépenses | 🔄 À faire |
| **Phase 12** | Historique Maintenance | 🔄 À faire |
| **Phase 13** | Suivi Kilométrage & Anomalies | 🔄 À faire |
| **Phase 14** | Dashboard Métier (KPIs, graphiques) | 🔄 À faire |
| **Phase 15** | Incidents & Blacklist | 🔄 À faire |
| **Phase 16** | Score de Confiance (TRUSTED / WATCHLIST / RISKY) | 🔄 À faire |
| **Phase 17** | Alertes (assurance, visite technique, abonnement) | 🔄 À faire |
| **Phase 18** | Notifications In-App & Email | 🔄 À faire |
| **Phase 19** | WhatsApp Business API | 🔮 Futur |
| **Phase 20** | Audit Feed (activité récente) | 🔄 À faire |
| **Phase 21** | Production (sécurité, performance, monitoring) | 🔄 À faire |

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- Docker & Docker Compose
- pnpm (recommandé)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-org/voituresaas.git
cd voituresaas

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp .env.example .env

# Démarrer les services (PostgreSQL, etc.)
docker-compose up -d

# Appliquer les migrations Prisma
cd apps/api && pnpm prisma migrate dev

# Seed initial (Super Admin + Plans SaaS)
pnpm prisma db seed

# Démarrer en développement
pnpm dev
```

### Variables d'environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/voituresaas"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@voituresaas.ma"

# Stockage (Cloudflare R2 ou AWS S3)
S3_BUCKET="voituresaas-files"
S3_REGION="auto"
S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
```

---

## 📁 Structure du Projet

```
voituresaas/
├── apps/
│   ├── web/                    # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── components/     # Composants réutilisables
│   │   │   ├── pages/          # Pages par module
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── stores/         # State management
│   │   │   └── lib/            # Utils & config
│   │   └── package.json
│   └── api/                    # Backend Express + TypeScript
│       ├── src/
│       │   ├── routes/         # Routes API
│       │   ├── controllers/    # Logique métier
│       │   ├── middlewares/    # Auth, roles, scope
│       │   ├── services/       # Services réutilisables
│       │   └── utils/          # Helpers
│       ├── prisma/
│       │   ├── schema.prisma   # Schéma base de données
│       │   ├── migrations/     # Migrations
│       │   └── seed.ts         # Données initiales
│       └── package.json
├── packages/
│   └── shared/                 # Types & utils partagés
├── docker-compose.yml
├── docker-compose.prod.yml
└── package.json
```

---

## 🔒 Sécurité

- **JWT** avec refresh tokens rotatifs
- **RBAC** (Role-Based Access Control) granulaire
- **AgencyScope middleware** : isolation stricte entre agences
- **Subscription middleware** : vérification du plan actif
- **Rate limiting** (production)
- **Helmet** (headers HTTP sécurisés)
- **Passwords hashés** avec Argon2

---

## 📊 Capacité Cible

| Métrique | Cible |
|----------|-------|
| 🏢 Agences | 500+ |
| 👥 Clients | 50 000+ |
| 🚗 Véhicules | 10 000+ |
| 📋 Réservations | 100 000+ |
| ⏱️ SLA Disponibilité | 99.9% |

---

## 🔮 Fonctionnalités Futures

- **Site public par agence** : `agence.voituresaas.ma` avec réservation en ligne
- **IA** : prédiction de la demande, tarification dynamique, scoring avancé
- **API Publique** : pour partenaires et intégrations tierces
- **Application Mobile** : React Native / Flutter

---

## 📋 Documentation

- 📄 [Cahier des Charges PDF](./docs/VoitureSaaS_Cahier_des_Charges.pdf)
- 🗄️ [Schéma Base de Données](./apps/api/prisma/schema.prisma)

---

## 🤝 Contribution

Ce projet est en développement actif. Pour contribuer :

1. Créez une branche feature : `git checkout -b feature/phase-3-agencies`
2. Committez vos changements : `git commit -m 'feat(phase3): add agency CRUD'`
3. Pushez : `git push origin feature/phase-3-agencies`
4. Ouvrez une Pull Request

### Convention de commits
```
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
refactor: Refactoring sans changement de comportement
docs:     Mise à jour documentation
test:     Ajout/modification de tests
chore:    Maintenance & configuration
```

---

<div align="center">

**VoitureSaaS** — La meilleure plateforme SaaS de gestion de location de voitures au Maroc 🇲🇦

*Confidentiel — © 2026 VoitureSaaS. Tous droits réservés.*

</div>
