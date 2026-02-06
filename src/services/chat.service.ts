import type { ModelMessage } from "ai";
import type { ConversationOutput } from "../models/converstation";
import { aiService } from "./ai.service";
import { conversationsService } from "./conversations.service";
import { logger } from "./logger.service";

export const chatService = {
	async processMessage(userId: string, message: string): Promise<ConversationOutput> {
		logger.breadcrumb("Processing user message", { userId, messageLength: message.length });
		
		try {
			const userConversations = await conversationsService.getUserConversations(userId);

			if (userConversations.length === 0) {
				logger.info("Starting new conversation", { userId });
				return await this.startNewConversation(userId, message);
			}

			const conversation = userConversations[0];
			if (!conversation?._id) {
				throw new Error("Failed to get conversation");
			}

			logger.breadcrumb("Continuing existing conversation", { 
				userId, 
				conversationId: conversation._id.toString() 
			});
			return await this.continueConversation(conversation._id.toString(), message);
		} catch (error) {
			logger.error(error, { userId, messagePreview: message.substring(0, 50) });
			throw error;
		}
	},

	async startNewConversation(userId: string, message: string): Promise<ConversationOutput> {
		const newConversation = await conversationsService.createConversation(userId, message);

		if (!newConversation._id) {
			throw new Error("Failed to create conversation");
		}

		const conversationId = newConversation._id.toString();
		const userMessage: ModelMessage = { role: "user", content: message };

		const result = await aiService.processMessage([userMessage], userId);

		await conversationsService.addMessages(conversationId, [userMessage, ...result.response.messages]);

		logger.info("New conversation created", { userId, conversationId });
		return { response: result.text, conversationId };
	},

	async continueConversation(conversationId: string, message: string): Promise<ConversationOutput> {
		const conversation = await conversationsService.getConversation(conversationId);
		if (!conversation) {
			throw new Error("Conversation not found");
		}

		const messages = await conversationsService.getConversationMessages(conversationId);
		const userMessage: ModelMessage = { role: "user", content: message };

		messages.push(userMessage);

		const result = await aiService.processMessage(messages, conversation.userId);

		await conversationsService.addMessages(conversationId, [userMessage, ...result.response.messages]);

		return { response: result.text, conversationId };
	},
};
