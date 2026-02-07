import type { ModelMessage } from "ai";
import type { ObjectId } from "mongodb";
import z from "zod";

export const conversationSchema = z.object({
	_id: z.custom<ObjectId>().optional(),
	userId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	messages: z.array(z.custom<ModelMessage>()).default([]),
});

export const conversationInputSchema = z.object({
	userId: z.string(),
	message: z.string(),
});

export const conversationOutputSchema = z.object({
	conversationId: z.string(),
	response: z.string(),
});


export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationInput = z.infer<typeof conversationInputSchema>;
export type ConversationOutput = z.infer<typeof conversationOutputSchema>;
