import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis")
});

export const registerAgencySchema = z.object({
  agencyName: z.string().min(2, "Nom agence requis"),
  agencyEmail: z.string().email("Email agence invalide"),
  agencyPhone: z.string().optional(),
  agencyAddress: z.string().optional(),
  agencyCity: z.string().optional(),
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email admin invalide"),
  phone: z.string().optional(),
  password: z.string().min(8, "Minimum 8 caractères")
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterAgencyFormValues = z.infer<typeof registerAgencySchema>;
