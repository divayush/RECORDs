import type { SpendingInput } from '../models/spending.model.js';

type SpendingRequestBody = Record<string, unknown>;

const toRequiredString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
};

const toOptionalString = (value: unknown) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new Error('notes must be text.');

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toMoneyNumber = (value: unknown, field: string) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${field} must be a positive number or 0.`);
  }

  return numberValue;
};

const toSpentAt = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return new Date();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('spentAt must be a valid date.');
  return date;
};

export const validateSpendingCreate = (body: SpendingRequestBody): SpendingInput => ({
  sentTo: toRequiredString(body.sentTo, 'sentTo'),
  forWhat: toRequiredString(body.forWhat, 'forWhat'),
  sentWhat: toMoneyNumber(body.sentWhat, 'sentWhat'),
  notes: toOptionalString(body.notes),
  spentAt: toSpentAt(body.spentAt),
});
