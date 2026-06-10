import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1)
});

export const registerAgencySchema = z.object({
  agency: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
    phone: z.string().max(40).optional(),
    address: z.string().max(240).optional(),
    city: z.string().max(80).optional()
  }),
  admin: z.object({
    firstName: z.string().min(2).max(80),
    lastName: z.string().min(2).max(80),
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
    phone: z.string().max(40).optional(),
    password: z.string().min(8).max(128)
  })
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterAgencyInput = z.infer<typeof registerAgencySchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
