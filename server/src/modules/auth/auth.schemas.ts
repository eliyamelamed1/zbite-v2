import { z } from 'zod';

export const RegisterBodySchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});
export type RegisterBody = z.infer<typeof RegisterBodySchema>;

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginBody = z.infer<typeof LoginBodySchema>;

export const InterestsBodySchema = z.object({
  interests: z.array(z.string()),
});
export type InterestsBody = z.infer<typeof InterestsBodySchema>;

export const GoogleAuthBodySchema = z.object({
  credential: z.string().min(1),
});
export type GoogleAuthBody = z.infer<typeof GoogleAuthBodySchema>;
