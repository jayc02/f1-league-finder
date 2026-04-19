import { z } from 'zod';

const isImageReference = (value: string) => value.startsWith('/uploads/') || /^https?:\/\//i.test(value);

export const imageAssetSchema = z
  .string()
  .max(2048)
  .refine((value) => isImageReference(value), 'Image must be an uploaded asset or HTTPS URL.');
