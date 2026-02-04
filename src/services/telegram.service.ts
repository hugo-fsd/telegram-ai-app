import { Bot, webhookCallback } from "grammy";
import { env } from "../config/env";
import { chatService } from "./chat.service";
import { usersService } from "./users.service";

class TelegramService {
	private bot: Bot;

	constructor() {
		this.bot = new Bot(env.TELEGRAM_BOT_TOKEN);
		this.setupHandlers();
	}

	private setupHandlers() {
		this.bot.on("message:text", async (ctx) => {
			try {
				if (ctx.message.text.startsWith("/")) {
					await this.handleCommand(ctx);
				} else {
					await this.handleMessage(ctx);
				}
			} catch (error) {
				console.error("Error processing Telegram message:", error);
				await ctx.reply("Sorry, I encountered an error processing your message. Please try again.");
			}
		});

		this.bot.catch((err) => {
			console.error("Telegram bot error:", err);
		});
	}

	getWebhookCallback() {
		return webhookCallback(this.bot, "std/http");
	}

	async handleMessage(ctx: any): Promise<void> {
		await ctx.replyWithChatAction("typing");
		const user = await usersService.getUserById(ctx.from.id.toString());
		if (!user) {
			await ctx.reply("Sorry, you are not registered in the system. Please register first.");
			return;
		}

		const messageText = ctx.message.text;
		const response = await chatService.processMessage(user.userId, messageText);
		await ctx.reply(response.response);
	}

	async handleCommand(ctx: any): Promise<void> {
		const commandText = ctx.message.text;
		const command = commandText.split(" ")[0].toLowerCase();

		switch (command) {
			case "/start":
				await ctx.reply("👋 Hi! I'm your AI assistant. Send me a message and I'll help you out!");
				break;

			case "/help":
				await ctx.reply(
					"🤖 Available commands:\n" +
					"/start - Start the bot\n" +
					"/help - Show this help message\n" +
					"\nJust send me any message and I'll respond using AI!"
				);
				break;

			default:
				await ctx.reply("Unknown command. Use /help to see available commands.");
				break;
		}
	}

	async setWebhook(url: string) {
		await this.bot.api.setWebhook(url);
		console.log(`🤖 Telegram webhook set to: ${url}`);
	}

	async removeWebhook() {
		await this.bot.api.deleteWebhook();
		console.log("🤖 Telegram webhook removed");
	}

	async stop() {
		await this.bot.stop();
		console.log("🤖 Telegram bot stopped");
	}
}

export const telegramService = new TelegramService();
