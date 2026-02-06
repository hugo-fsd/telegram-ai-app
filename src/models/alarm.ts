import { z } from "zod";

export const alarmSchema = z.object({
	_id: z.custom<{ toString(): string }>().optional(),
	userId: z.string().min(1),
	name: z.string().min(1),
	description: z.string(),
	cronExpression: z.string().min(1),
	cronJobId: z.number().optional(),
	active: z.boolean().default(true),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const createAlarmSchema = alarmSchema.pick({
	name: true,
	description: true,
	cronExpression: true,
});

export type Alarm = z.infer<typeof alarmSchema>;
export type CreateAlarmRequest = z.infer<typeof createAlarmSchema>;
