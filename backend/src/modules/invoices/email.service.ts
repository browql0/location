import { env } from "../../config/env.js";

function canSendEmail() {
  return env.EMAIL_PROVIDER !== "mock" && Boolean(env.EMAIL_FROM);
}

export const EmailService = {
  async sendRentalInvoiceToClient(invoiceId: string, recipient?: string | null) {
    if (!canSendEmail() || !recipient) {
      console.info("email skipped", { invoiceId, kind: "rental_client", recipient: recipient ?? null });
      return false;
    }
    console.info("email queued", { invoiceId, kind: "rental_client", recipient });
    return true;
  },

  async sendSaasInvoiceToAgency(invoiceId: string, recipient?: string | null) {
    if (!canSendEmail() || !recipient) {
      console.info("email skipped", { invoiceId, kind: "saas_agency", recipient: recipient ?? null });
      return false;
    }
    console.info("email queued", { invoiceId, kind: "saas_agency", recipient });
    return true;
  }
};
