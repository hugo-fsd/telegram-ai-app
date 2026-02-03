import type { ModelMessage } from "ai";
import type { ObjectId } from "mongodb";
import z from "zod";

export const conversationSchema = z.object({
	_id: z.custom<ObjectId>().optional(),
	userId: z.string(),
	name: z.string().optional(),
	description: z.string().optional(),
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

export const conversationStarterOutputSchema = z.object({
	name: z.string().describe("A short, descriptive title for the conversation based on the user's message"),
	description: z.string().describe("A brief summary of what the conversation is about"),
});

export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationInput = z.infer<typeof conversationInputSchema>;
export type ConversationOutput = z.infer<typeof conversationOutputSchema>;
