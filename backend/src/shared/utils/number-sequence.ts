import type { Prisma } from "@prisma/client";

export async function nextSequenceValue(
  tx: Prisma.TransactionClient,
  input: { scope: string; type: string; year: number }
) {
  const sequence = await tx.numberSequence.upsert({
    where: { scope_type_year: input },
    create: { ...input, currentValue: 1 },
    update: { currentValue: { increment: 1 } },
    select: { currentValue: true }
  });

  return sequence.currentValue;
}

export function formatDocumentNumber(prefix: string, year: number, value: number) {
  return `${prefix}-${year}-${String(value).padStart(6, "0")}`;
}
