import * as Sentry from "@sentry/bun";

/**
 * Centralized Sentry logging utility
 * Import this in any file to use Sentry logging
 */
export const logger = {
	/**
	 * Capture an exception/error
	 * @example logger.error(new Error("Something went wrong"), { userId: 123 })
	 */
	error: (error: Error | unknown, context?: Record<string, any>) => {
		if (context) {
			Sentry.setContext("custom", context);
		}
		Sentry.captureException(error);
		console.error("❌ Error:", error);
	},

	/**
	 * Log an informational message to Sentry
	 * @example logger.info("User sent a message", { userId: 123, messageId: 456 })
	 */
	info: (message: string, context?: Record<string, any>) => {
		Sentry.captureMessage(message, {
			level: "info",
			contexts: context ? { custom: context } : undefined,
		});
		console.log("ℹ️", message);
	},

	/**
	 * Log a warning message to Sentry
	 * @example logger.warning("Rate limit approaching", { currentUsage: 95 })
	 */
	warning: (message: string, context?: Record<string, any>) => {
		Sentry.captureMessage(message, {
			level: "warning",
			contexts: context ? { custom: context } : undefined,
		});
		console.warn("⚠️", message);
	},

	/**
	 * Add a breadcrumb (for tracking user actions leading up to an error)
	 * @example logger.breadcrumb("User clicked button", { buttonId: "submit" })
	 */
	breadcrumb: (message: string, data?: Record<string, any>) => {
		Sentry.addBreadcrumb({
			message,
			data,
			level: "info",
			timestamp: Date.now() / 1000,
		});
	},

	/**
	 * Set user context for all subsequent events
	 * @example logger.setUser({ id: "123", username: "john_doe" })
	 */
	setUser: (user: { id: string; username?: string; email?: string }) => {
		Sentry.setUser(user);
	},

	/**
	 * Clear user context
	 */
	clearUser: () => {
		Sentry.setUser(null);
	},

	/**
	 * Add custom tags to events
	 * @example logger.setTag("environment", "production")
	 */
	setTag: (key: string, value: string) => {
		Sentry.setTag(key, value);
	},

	/**
	 * Start a performance transaction
	 * @example const transaction = logger.startTransaction("process_message")
	 */
	startTransaction: (name: string, op?: string) => {
		if (typeof (Sentry as any).startTransaction === "function") {
			return (Sentry as any).startTransaction({ name, op: op || "function" });
		} else {
			console.warn("Sentry.startTransaction is not available in this Sentry SDK.");
			return null;
		}
	},
};

// Re-export Sentry for advanced usage
export { Sentry };
