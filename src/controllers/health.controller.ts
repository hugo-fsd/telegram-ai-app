import { Elysia } from "elysia";
import { logger } from "../services/logger.service";

export const healthController = new Elysia()
	.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
	.get("/sentry-test", () => {
		logger.info("Sentry test endpoint called");
		logger.warning("This is a test warning");
		logger.error(new Error("This is a test error"), { test: true });
		return { message: "Sentry test events sent! Check your Sentry dashboard." };
	});
