// helpers/schemaHelper.js
import { z } from 'zod';

export const UserSchema = z.object({
  id:         z.number().positive(),
  name:       z.string().min(2),
  job:        z.string().min(2),
  createdAt:  z.string().optional(),
});


export const UsersArraySchema = z.array(UserSchema);

export const ErrorSchema = z.object({
  error:   z.string(),
  details: z.array(z.string()).optional(),
});