import type { ModelMessage } from "ai";
import type { Conversation } from "../models/converstation";
import { conversationsRepository } from "../repositories/conversations.repository";
import { removeEmpty } from "./utils.service";

export const conversationsService = {
	async getOrCreateConversation(userId: string): Promise<Conversation> {
		let conversation = await conversationsRepository.getConversationByUserId(userId);
		
		if (!conversation) {
			const newConversation = {
				userId,
				createdAt: new Date(),
				updatedAt: new Date(),
				messages: [],
			};
			conversation = await conversationsRepository.createConversation(newConversation);
		}
		
		return conversation;
	},

	async getConversation(conversationId: string): Promise<Conversation | null> {
		return await conversationsRepository.getConversation(conversationId);
	},

	async addMessage(conversationId: string, message: ModelMessage): Promise<void> {
		const cleanMessage = removeEmpty(message);
		await conversationsRepository.addMessage(conversationId, cleanMessage);
	},

	async addMessages(conversationId: string, messages: ModelMessage[]): Promise<void> {
		const cleanMessages = messages.map((message) => removeEmpty(message));
		await conversationsRepository.addMessages(conversationId, cleanMessages);
	},
};
