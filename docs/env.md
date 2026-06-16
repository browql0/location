# RENTORA environment variables

Do not commit real values. Keep local `.env` files ignored by Git and store production secrets in the deployment platform secret manager.

## Backend

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `test`, or `production`. |
| `PORT` | Yes | Backend HTTP port. |
| `API_PREFIX` | Yes | API prefix, for example `/api/v1`. |
| `DATABASE_URL` | Yes | PostgreSQL connection URL. |
| `JWT_ACCESS_SECRET` | Yes | Production value must be unique, non-placeholder, and at least 32 characters. |
| `JWT_REFRESH_SECRET` | Yes | Production value must be unique, different from access secret, non-placeholder, and at least 32 characters. |
| `JWT_ACCESS_EXPIRES_IN` | Yes | Access token TTL, for example `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | Yes | Refresh token TTL in days, for example `30d`. |
| `CORS_ORIGIN` | Yes | Comma-separated trusted origins. In production, `*` is rejected and this must include `FRONTEND_APP_URL`. |
| `FRONTEND_APP_URL` | Yes | Public frontend application URL. |

## Cloudflare R2

| Variable | Required | Notes |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account id. |
| `R2_ACCESS_KEY_ID` | Yes | R2 access key id. |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret access key. |
| `R2_BUCKET_NAME` | Yes | Private R2 bucket name. |
| `R2_ENDPOINT` | Yes | S3-compatible R2 endpoint URL. |

## Email

| Variable | Required | Notes |
| --- | --- | --- |
| `EMAIL_PROVIDER` | Yes | `mock`, `smtp`, or `resend`. |
| `SMTP_HOST` | No | Required only for SMTP. |
| `SMTP_PORT` | No | Required only for SMTP. |
| `SMTP_USER` | No | Required only for SMTP. |
| `SMTP_PASS` | No | Required only for SMTP. |
| `EMAIL_FROM` | No | Sender address for outgoing email. |

## PayPal client rental payments

| Variable | Required | Notes |
| --- | --- | --- |
| `PAYPAL_MODE` | Yes | `sandbox` or `live`. |
| `PAYPAL_CLIENT_ID` | For PayPal | Backend-only client id. Never expose it through frontend config. |
| `PAYPAL_CLIENT_SECRET` | For PayPal | Backend-only secret. Never expose it through frontend config. |
| `PAYPAL_CURRENCY` | Yes | Currency for client rental payments, for example `MAD`. |
| `PAYPAL_RETURN_URL` | Yes | Frontend URL where PayPal returns after approval. |
| `PAYPAL_CANCEL_URL` | Yes | Frontend URL where PayPal returns after cancellation. |

## Seed-only local variables

| Variable | Required | Notes |
| --- | --- | --- |
| `SUPER_ADMIN_EMAIL` | Local only | Used by seed scripts. |
| `SUPER_ADMIN_PASSWORD` | Local only | Use a strong value; never reuse a production password. |
| `SUPER_ADMIN_FIRST_NAME` | Local only | Used by seed scripts. |
| `SUPER_ADMIN_LAST_NAME` | Local only | Used by seed scripts. |

## Frontend

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Public API base URL. |
