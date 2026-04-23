import { z } from 'zod';

const isImageReference = (value: string) => /^https?:\/\//i.test(value) || value.startsWith('/');

export const imageAssetSchema = z
  .string()
  .max(2048)
  .refine((value) => isImageReference(value), 'Image must be a valid URL or site asset path.');
