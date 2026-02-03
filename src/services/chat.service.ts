import type { ModelMessage } from "ai";
import type { ConversationOutput } from "../models/converstation";
import { aiService } from "./ai.service";
import { conversationsService } from "./conversations.service";

export const chatService = {
	async processMessage(userId: string, message: string): Promise<ConversationOutput> {
		const userConversations = await conversationsService.getUserConversations(userId);

		if (userConversations.length === 0) {
			return await this.startNewConversation(userId, message);
		}

		const conversation = userConversations[0];
		if (!conversation?._id) {
			throw new Error("Failed to get conversation");
		}

		return await this.continueConversation(conversation._id.toString(), message);
	},

	async startNewConversation(userId: string, message: string): Promise<ConversationOutput> {
		const newConversation = await conversationsService.createConversation(userId, message);

		if (!newConversation._id) {
			throw new Error("Failed to create conversation");
		}

		const conversationId = newConversation._id.toString();
		const userMessage: ModelMessage = { role: "user", content: message };

		const result = await aiService.processMessage([userMessage]);

		await conversationsService.addMessages(conversationId, [userMessage, ...result.response.messages]);

		return { response: result.text, conversationId };
	},

	async continueConversation(conversationId: string, message: string): Promise<ConversationOutput> {
		const messages = await conversationsService.getConversationMessages(conversationId);
		const userMessage: ModelMessage = { role: "user", content: message };

		messages.push(userMessage);

		const result = await aiService.processMessage(messages);

		await conversationsService.addMessages(conversationId, [userMessage, ...result.response.messages]);

		return { response: result.text, conversationId };
	},
};
