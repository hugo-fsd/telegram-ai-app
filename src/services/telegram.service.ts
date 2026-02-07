import { Bot, type Context, type Filter, webhookCallback } from "grammy";
import { env } from "../config/env";
import { chatService } from "./chat.service";
import { logger } from "./logger.service";
import { usersService } from "./users.service";

type MessageContext = Filter<Context, "message:text">;

class TelegramService {
	private bot: Bot;

	constructor() {
		this.bot = new Bot(env.TELEGRAM_BOT_TOKEN);
		this.setupHandlers();
	}

	private setupHandlers() {
		this.bot.on("message:text", async (ctx) => {
			if (ctx.message.text.startsWith("/")) {
				await this.handleCommand(ctx);
			} else {
				await this.handleMessage(ctx);
			}
		});

		this.bot.catch((err) => {
			logger.error(err, { context: "Telegram bot global error handler" });
		});
	}

	getWebhookCallback() {
		return webhookCallback(this.bot, "std/http");
	}

	async handleMessage(ctx: MessageContext): Promise<void> {
		await ctx.replyWithChatAction("typing");

		const userId = ctx.from.id.toString();
		const username = ctx.from.username || ctx.from.first_name;

		logger.setUser({ id: userId, username });
		logger.breadcrumb("Received Telegram message", {
			userId,
			username,
			messageLength: ctx.message.text.length
		});

		try {
			let user = await usersService.getUserById(userId);
			if (!user) {
				user = await usersService.createUser({ name: username }, userId);
			}

			if (!user.activated) {
				logger.warning("Inactive user attempted to use bot", {
					telegramId: userId,
					username,
					activated: user.activated
				});
				await ctx.reply(
					"⚠️ Your account is not activated yet.\n\n" +
					"Please contact an administrator to activate your account."
				);
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
		} catch (error) {
			logger.error(error, {
				userId,
				username,
				message: ctx.message.text.substring(0, 100)
			});
			await ctx.reply("Sorry, I encountered an error processing your message. Please try again.");
		} finally {
			logger.clearUser();
		}
	}

	async handleCommand(ctx: MessageContext): Promise<void> {
		const commandText = ctx.message.text;
		const command = commandText.split(" ")[0]?.toLowerCase() ?? "";

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

	async sendMessage(userId: string, message: string) {
		await this.bot.api.sendMessage(parseInt(userId, 10), message, {
			parse_mode: "Markdown",
		});
	}

	async setWebhook(url: string) {
		try {
			await this.bot.api.setWebhook(url, {
				drop_pending_updates: true,
			});
			logger.info("Telegram webhook set successfully", { url });
		} catch (error) {
			logger.error(error, { context: "setWebhook", url });
			throw error;
		}
	}

	async removeWebhook() {
		try {
			await this.bot.api.deleteWebhook({ drop_pending_updates: true });
			logger.info("Telegram webhook removed successfully");
		} catch (error) {
			logger.error(error, { context: "removeWebhook" });
		}
	}


	async stop() {
		await this.bot.stop();
		logger.info("Telegram bot stopped");
	}
}

export const telegramService = new TelegramService();
