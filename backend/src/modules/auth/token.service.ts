import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../../config/env.js";

type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  agencyId: string | null;
};

export function signAccessToken(payload: AccessTokenPayload) {
  const options: SignOptions = {
    subject: payload.sub,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(
    {
      role: payload.role,
      agencyId: payload.agencyId
    },
    env.JWT_ACCESS_SECRET,
    options
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid access token");
  }

  return {
    sub: payload.sub,
    role: payload.role as UserRole,
    agencyId: typeof payload.agencyId === "string" ? payload.agencyId : null
  };
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("base64url");
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiryDate() {
  const match = /^(\d+)d$/.exec(env.JWT_REFRESH_EXPIRES_IN);
  const days = match ? Number(match[1]) : 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}
