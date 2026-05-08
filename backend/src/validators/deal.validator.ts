import { DealStatus } from '@prisma/client';
import type { DealInput } from '../models/deal.model.js';

type DealRequestBody = Record<string, unknown>;

const allowedStatuses = new Set<string>(Object.values(DealStatus));

function toMoneyNumber(value: unknown, field: string): number;
function toMoneyNumber(value: unknown, field: string, required: false): number | undefined;
function toMoneyNumber(value: unknown, field: string, required = true) {
  if ((value === undefined || value === null || value === '') && !required) {
    return undefined;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${field} must be a positive number or 0.`);
  }

  return numberValue;
}

const toRequiredString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
};

const toOptionalString = (value: unknown) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('notes must be text.');
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const toDealDate = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('dealDate is required.');
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('dealDate must be a valid date.');
  }

  return date;
};

const toStatus = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('status must be PROFIT, LOSS, or PENDING.');
  }

  const normalizedStatus = value.trim().toUpperCase();

  if (!allowedStatuses.has(normalizedStatus)) {
    throw new Error('status must be PROFIT, LOSS, or PENDING.');
  }

  return normalizedStatus as DealStatus;
};

export const validateDealCreate = (body: DealRequestBody): DealInput => ({
  dealAmount: toMoneyNumber(body.dealAmount, 'dealAmount'),
  holderFee: toMoneyNumber(body.holderFee, 'holderFee'),
  clientFee: toMoneyNumber(body.clientFee, 'clientFee'),
  holderUsername: toRequiredString(body.holderUsername, 'holderUsername'),
  clientUsername: toRequiredString(body.clientUsername, 'clientUsername'),
  profit: toMoneyNumber(body.profit, 'profit', false) ?? 0,
  loss: toMoneyNumber(body.loss, 'loss', false) ?? 0,
  dealDate: toDealDate(body.dealDate),
  status: toStatus(body.status),
  notes: toOptionalString(body.notes),
});

export const validateDealUpdate = (body: DealRequestBody): Partial<DealInput> => {
  const update: Partial<DealInput> = {};

  if ('dealAmount' in body) update.dealAmount = toMoneyNumber(body.dealAmount, 'dealAmount');
  if ('holderFee' in body) update.holderFee = toMoneyNumber(body.holderFee, 'holderFee');
  if ('clientFee' in body) update.clientFee = toMoneyNumber(body.clientFee, 'clientFee');
  if ('holderUsername' in body) update.holderUsername = toRequiredString(body.holderUsername, 'holderUsername');
  if ('clientUsername' in body) update.clientUsername = toRequiredString(body.clientUsername, 'clientUsername');
  if ('profit' in body) update.profit = toMoneyNumber(body.profit, 'profit');
  if ('loss' in body) update.loss = toMoneyNumber(body.loss, 'loss');
  if ('dealDate' in body) update.dealDate = toDealDate(body.dealDate);
  if ('status' in body) update.status = toStatus(body.status);
  if ('notes' in body) update.notes = toOptionalString(body.notes);

  if (Object.keys(update).length === 0) {
    throw new Error('At least one field is required to update a deal.');
  }

  return update;
};
