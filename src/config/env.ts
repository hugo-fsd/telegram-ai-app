import { z } from "zod";

const envSchema = z.object({
	OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
	AWS_REGION: z.string().default("us-east-1"),
	AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
	AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	PORT: z.coerce.number().default(8080),
	MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
	MONGODB_DB_NAME: z.string().min(1, "MONGODB_DB_NAME is required"),
	TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
	TELEGRAM_WEBHOOK_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("❌ Invalid environment variables:");
	console.error(parsed.error.issues);
	process.exit(1);
}

export const env = parsed.data;
