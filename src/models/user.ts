import { z } from "zod";
import type { Conversation } from "./converstation";

export const userSchema = z.object({
	userId: z.string().min(1),
	name: z.string().min(1),
	conversations: z.array(z.custom<Conversation>()).default([]),
	activated: z.boolean().default(false),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const createUserSchema = userSchema.pick({ name: true });

export const updateUserSchema = createUserSchema.partial();

export type User = z.infer<typeof userSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
