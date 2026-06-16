import { UserRole } from "@prisma/client";
import { prisma } from "../src/prisma/prisma.service.js";
import type { AuthContext } from "../src/shared/types/auth.js";
import { getCar } from "../src/modules/cars/car.service.js";
import { getClient, getDocumentDownload } from "../src/modules/clients/client.service.js";
import { getReservation } from "../src/modules/reservations/reservation.service.js";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function agencyAdminAuth(agencyId: string): AuthContext {
  return {
    userId: "rbac-smoke-agency-admin",
    role: UserRole.AGENCY_ADMIN,
    agencyId,
    permissions: [],
    agencyStatus: null,
    subscriptionStatus: null
  };
}

function superAdminAuth(): AuthContext {
  return {
    userId: "rbac-smoke-super-admin",
    role: UserRole.SUPER_ADMIN,
    agencyId: null,
    permissions: [],
    agencyStatus: null,
    subscriptionStatus: null
  };
}

async function expectDenied(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch {
    console.info(`OK denied: ${label}`);
    return;
  }
  throw new Error(`Expected denial failed: ${label}`);
}

async function main() {
  const agencyA = required("RBAC_SMOKE_AGENCY_A_ID");
  const agencyBCar = required("RBAC_SMOKE_AGENCY_B_CAR_ID");
  const agencyBClient = required("RBAC_SMOKE_AGENCY_B_CLIENT_ID");
  const agencyBReservation = required("RBAC_SMOKE_AGENCY_B_RESERVATION_ID");
  const agencyBDocument = process.env.RBAC_SMOKE_AGENCY_B_CLIENT_DOCUMENT_ID;

  const authA = agencyAdminAuth(agencyA);

  await expectDenied("agency A cannot read agency B car", () => getCar(agencyBCar, authA));
  await expectDenied("agency A cannot read agency B client", () => getClient(agencyBClient, authA));
  await expectDenied("agency A cannot read agency B reservation", () => getReservation(agencyBReservation, authA));

  if (agencyBDocument) {
    await expectDenied("agency A cannot download agency B client document", () => getDocumentDownload(agencyBDocument, authA, {}));
  }

  await getCar(agencyBCar, superAdminAuth());
  await getClient(agencyBClient, superAdminAuth());
  await getReservation(agencyBReservation, superAdminAuth());
  console.info("OK super admin can read global records");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
