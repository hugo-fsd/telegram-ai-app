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
		console.log("Setting up Telegram handlers...");
		this.bot.command("start", async (ctx) => {
			await ctx.reply("👋 Hi! I'm your AI assistant. Send me a message and I'll help you out!");
		});

		this.bot.on("message:text", async (ctx) => {
			console.log("Received message:", ctx.message.text);
			try {

				const user = await usersService.getUserById(ctx.from.id.toString());
				if (!user) {
					await ctx.reply("Sorry, you are not registered in the system. Please register first.");
					return;
				}

				else {
					const messageText = ctx.message.text;
					await ctx.replyWithChatAction("typing");
					const response = await chatService.processMessage(user.userId, messageText);
					await ctx.reply(response.response);
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

	/**
	 * Returns the webhook callback for handling Telegram updates
	 * Use this in your HTTP endpoint
	 */
	getWebhookCallback() {
		return webhookCallback(this.bot, "std/http");
	}

	/**
	 * Set the webhook URL (call this once when deploying)
	 * @param url - Your public webhook URL (e.g., https://yourdomain.com/telegram/webhook)
	 */
	async setWebhook(url: string) {
		await this.bot.api.setWebhook(url);
		console.log(`🤖 Telegram webhook set to: ${url}`);
	}

	/**
	 * Remove webhook (useful for switching to polling in development)
	 */
	async removeWebhook() {
		await this.bot.api.deleteWebhook();
		console.log("🤖 Telegram webhook removed");
	}

	/**
	 * Start polling mode (for local development without public URL)
	 */
	async startPolling() {
		console.log("🤖 Starting Telegram bot in polling mode...");
		await this.bot.start();
	}

	/**
	 * Stop the bot
	 */
	async stop() {
		await this.bot.stop();
		console.log("🤖 Telegram bot stopped");
	}
}

export const telegramService = new TelegramService();
