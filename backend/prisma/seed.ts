import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const planSeed = [
  {
    name: "Free Trial",
    description: "Essai gratuit de 30 jours pour découvrir la plateforme.",
    priceMonthly: "0",
    priceYearly: "0",
    trialDays: 30,
    maxUsers: 2,
    maxCars: 5,
    maxClients: 100,
    maxReservations: 100,
    canUseInvoices: true,
    canUseContracts: true,
    canUseIncidents: false,
    canUseAdvancedReports: false,
    canUseApiAccess: false,
    sortOrder: 1
  },
  {
    name: "Basic",
    description: "Plan essentiel pour une petite agence.",
    priceMonthly: "299",
    priceYearly: "2990",
    trialDays: 0,
    maxUsers: 5,
    maxCars: 25,
    maxClients: 1000,
    maxReservations: 3000,
    canUseInvoices: true,
    canUseContracts: true,
    canUseIncidents: false,
    canUseAdvancedReports: false,
    canUseApiAccess: false,
    sortOrder: 2
  },
  {
    name: "Pro",
    description: "Plan avancé pour les agences en croissance.",
    priceMonthly: "599",
    priceYearly: "5990",
    trialDays: 0,
    maxUsers: 15,
    maxCars: 100,
    maxClients: 10000,
    maxReservations: 30000,
    canUseInvoices: true,
    canUseContracts: true,
    canUseIncidents: true,
    canUseAdvancedReports: true,
    canUseApiAccess: false,
    sortOrder: 3
  },
  {
    name: "Enterprise",
    description: "Plan sur mesure pour réseaux et grands comptes.",
    priceMonthly: "1499",
    priceYearly: "14990",
    trialDays: 0,
    maxUsers: null,
    maxCars: null,
    maxClients: null,
    maxReservations: null,
    canUseInvoices: true,
    canUseContracts: true,
    canUseIncidents: true,
    canUseAdvancedReports: true,
    canUseApiAccess: true,
    sortOrder: 4
  }
];

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@voiture-saas.local";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME ?? "Super";
  const lastName = process.env.SUPER_ADMIN_LAST_NAME ?? "Admin";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      passwordHash,
      role: UserRole.SUPER_ADMIN
    },
    create: {
      email,
      firstName,
      lastName,
      passwordHash,
      role: UserRole.SUPER_ADMIN
    }
  });

  for (const plan of planSeed) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
