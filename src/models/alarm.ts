import { z } from "zod";

const scheduleSchema = z.object({
	timezone: z.string().default("UTC"),
	expiresAt: z.number().default(0),
	hours: z.array(z.number().int().min(0).max(23)),
	minutes: z.array(z.number().int().min(0).max(59)),
	mdays: z.array(z.number().int().min(1).max(31)),
	months: z.array(z.number().int().min(1).max(12)),
	wdays: z.array(z.number().int().min(-1).max(7)),
});

export const alarmSchema = z.object({
	_id: z.custom<{ toString(): string }>().optional(),
	userId: z.string().min(1),
	name: z.string().min(1),
	description: z.string(),
	schedule: scheduleSchema,
	cronJobId: z.number().optional(),
	active: z.boolean().default(true),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const createAlarmSchema = alarmSchema.pick({
	name: true,
	description: true,
	schedule: true,
});

export type Alarm = z.infer<typeof alarmSchema>;
export type CreateAlarmRequest = z.infer<typeof createAlarmSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;