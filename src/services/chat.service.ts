import type { ModelMessage } from "ai";
import type { ConversationOutput } from "../models/converstation";
import { aiService } from "./ai.service";
import { conversationsService } from "./conversations.service";

export const chatService = {
	async processMessage(userId: string, message: string): Promise<ConversationOutput> {
		const conversation = await conversationsService.getOrCreateConversation(userId);
		const conversationId = conversation._id?.toString() || "";

		const userMessage: ModelMessage = { role: "user", content: message };
		const existingMessages = conversation.messages || [];
		const messagesForAgent = [...existingMessages, userMessage];

		const result = await aiService.processMessage(messagesForAgent, userId);

		await conversationsService.addMessage(conversationId, userMessage);
		await conversationsService.addMessages(conversationId, result.response.messages);

		return { response: result.text, conversationId };
	},
};
