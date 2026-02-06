import { Bot, webhookCallback } from "grammy";
import { env } from "../config/env";
import { chatService } from "./chat.service";
import { usersService } from "./users.service";
import { logger } from "./logger.service";

class TelegramService {
	private bot: Bot;

	constructor() {
		this.bot = new Bot(env.TELEGRAM_BOT_TOKEN);
		this.setupHandlers();
	}

	private setupHandlers() {
		this.bot.on("message:text", async (ctx) => {
			const userId = ctx.from.id.toString();
			const username = ctx.from.username || ctx.from.first_name;
			
			// Set user context for this request
			logger.setUser({ id: userId, username });
			logger.breadcrumb("Received Telegram message", { 
				userId, 
				username,
				messageLength: ctx.message.text.length 
			});
			
			console.log("Telegram message:", ctx.message.text);
			
			try {
				if (ctx.message.text.startsWith("/")) {
					await this.handleCommand(ctx);
				} else {
					await this.handleMessage(ctx);
				}
			} catch (error) {
				logger.error(error, { 
					userId, 
					username,
					message: ctx.message.text.substring(0, 100) 
				});
				console.error("Error processing Telegram message:", error);
				await ctx.reply("Sorry, I encountered an error processing your message. Please try again.");
			} finally {
				// Clear user context after request
				logger.clearUser();
			}
		});

		this.bot.catch((err) => {
			logger.error(err, { context: "Telegram bot global error handler" });
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
			logger.warning("Unregistered user attempted to use bot", { 
				telegramId: ctx.from.id.toString(),
				username: ctx.from.username 
			});
			await ctx.reply("Sorry, you are not registered in the system. Please register first.");
			return;
		}

		const messageText = ctx.message.text;
		logger.info("Processing user message", { 
			userId: user.userId,
			messagePreview: messageText.substring(0, 50) 
		});
		
		const response = await chatService.processMessage(user.userId, messageText);

		const replyText = response.response?.trim() || "I apologize, but I couldn't generate a response. Please try again.";
		await ctx.reply(replyText);
		
		logger.info("Successfully sent response to user", { 
			userId: user.userId,
			responseLength: replyText.length 
		});
	}

	async handleCommand(ctx: any): Promise<void> {
		const commandText = ctx.message.text;
		const command = commandText.split(" ")[0].toLowerCase();
		
		logger.breadcrumb("User executed command", { 
			command,
			userId: ctx.from.id.toString() 
		});

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
				logger.warning("Unknown command executed", { 
					command,
					userId: ctx.from.id.toString() 
				});
				await ctx.reply("Unknown command. Use /help to see available commands.");
				break;
		}
	}

	async setWebhook(url: string) {
		try {
			await this.bot.api.setWebhook(url, {
				drop_pending_updates: true,
			});
			logger.info("Telegram webhook set successfully", { url });
			console.log(`🤖 Telegram webhook set to: ${url}`);
		} catch (error) {
			logger.error(error, { context: "setWebhook", url });
			console.error("Failed to set webhook:", error);
			throw error;
		}
	}

	async removeWebhook() {
		try {
			await this.bot.api.deleteWebhook({ drop_pending_updates: true });
			logger.info("Telegram webhook removed successfully");
			console.log("🤖 Telegram webhook removed");
		} catch (error) {
			logger.error(error, { context: "removeWebhook" });
			console.error("Failed to remove webhook:", error);
		}
	}

	async stop() {
		await this.bot.stop();
		logger.info("Telegram bot stopped");
		console.log("🤖 Telegram bot stopped");
	}
}

export const telegramService = new TelegramService();
