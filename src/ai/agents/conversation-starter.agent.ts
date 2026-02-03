import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import type { Conversation } from "../../models/converstation";
import { conversationStarterOutputSchema } from "../../models/converstation";

export const conversationStarterAgent = {
	async createConversation(userId: string, userMessage: string): Promise<Conversation> {
		const { output } = await generateText({
			model: openrouter("arcee-ai/trinity-large-preview:free"),
			system: `You are a conversation starter assistant. Based on the user's first message, generate a conversation title and description.
The title should be short (2-5 words) and descriptive.
The description should be a brief summary (1-2 sentences) of what the conversation is about.`,
			prompt: `User's message: "${userMessage}"`,
			output: Output.object({
				schema: conversationStarterOutputSchema,
			}),
		});

		return {
			userId,
			name: output.name,
			description: output.description,
			createdAt: new Date(),
			updatedAt: new Date(),
			messages: [],
		};
	},
};
