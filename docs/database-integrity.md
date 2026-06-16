# Rentora database integrity notes

## Concurrent reservations

Rentora uses a PostgreSQL exclusion constraint to prevent overlapping active reservations for the same car:

- key: `Reservation_no_active_car_overlap`
- range: `tsrange("startDate", "endDate", '[)')`
- active statuses: `CONFIRMED`, `IN_PROGRESS`

This blocks concurrent writes at database level, even if two application workers pass the service-level availability check at the same time.

Prisma limitation: exclusion constraints and partial indexes are not representable in `schema.prisma`. They must stay in SQL migrations and be checked during migration review.

## Atomic document numbers

Contract and invoice numbers are allocated through `NumberSequence` inside the same transaction as document creation.

- contracts: scope is the agency id, type is `CONTRACT`, format is `CON-YYYY-000001`
- invoices: scope is `GLOBAL`, type is `INVOICE`, format is `INV-YYYY-000001`

The counter uses a unique key on `(scope, type, year)` plus atomic `upsert`/`increment`, so concurrent requests cannot receive the same number.

## Migration caveats

The reservation exclusion constraint and the active rental invoice unique index will fail to apply if production already contains conflicting rows. Run a pre-migration data check for overlapping active reservations and duplicate active rental invoices before applying this migration to a live database.
