import axios from "axios";

type ApiErrorBody = {
  statusCode?: number;
  code?: string;
  message?: string;
  details?: unknown;
};

const messagesByCode: Record<string, string> = {
  AGENCY_BLOCKED: "Cette agence n'est pas active.",
  AGENCY_REQUIRED: "Vous devez d'abord créer ou sélectionner une agence.",
  AUTH_REQUIRED: "Vous devez vous connecter pour continuer.",
  EMAIL_ALREADY_USED: "Un utilisateur avec cet email existe déjà.",
  FORBIDDEN: "Vous n'avez pas les permissions nécessaires.",
  INSUFFICIENT_PERMISSIONS: "Vous n'avez pas les permissions nécessaires.",
  INSUFFICIENT_ROLE: "Vous n'avez pas les permissions nécessaires.",
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect.",
  INVALID_ACCESS_TOKEN: "Votre session a expiré. Veuillez vous reconnecter.",
  INVALID_REFRESH_TOKEN: "Votre session a expiré. Veuillez vous reconnecter.",
  PLAN_NOT_FOUND: "Le plan sélectionné est introuvable.",
  REFRESH_TOKEN_REQUIRED: "Votre session a expiré. Veuillez vous reconnecter.",
  SUBSCRIPTION_BLOCKED: "Votre abonnement n'est pas actif.",
  SUBSCRIPTION_EXPIRED: "Votre abonnement a expiré.",
  SUPER_ADMIN_REQUIRED: "Cette action est réservée au Super Admin.",
  USER_ALREADY_EXISTS: "Un utilisateur avec cet email existe déjà.",
  USER_AGENCY_REQUIRED: "Veuillez sélectionner une agence pour cet utilisateur.",
  USER_SCOPE_FORBIDDEN: "Vous ne pouvez pas accéder à cet utilisateur.",
  VALIDATION_ERROR: "Les informations saisies sont invalides."
};

function detailsMessage(details: unknown) {
  if (!details || typeof details !== "object") return null;
  const fieldErrors = "fieldErrors" in details ? (details as { fieldErrors?: Record<string, string[]> }).fieldErrors : null;
  const formErrors = "formErrors" in details ? (details as { formErrors?: string[] }).formErrors : null;
  const firstFieldMessage = fieldErrors ? Object.values(fieldErrors).flat().find(Boolean) : null;
  return firstFieldMessage ?? formErrors?.find(Boolean) ?? null;
}

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  }

  const data = error.response?.data;
  if (!data) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  }

  if (data.code === "VALIDATION_ERROR") {
    return detailsMessage(data.details) ?? data.message ?? messagesByCode.VALIDATION_ERROR;
  }

  if (data.code && messagesByCode[data.code]) {
    return messagesByCode[data.code];
  }

  if (data.statusCode === 403 || error.response?.status === 403) {
    return messagesByCode.FORBIDDEN;
  }

  return data.message || "Une erreur est survenue. Veuillez réessayer.";
}
