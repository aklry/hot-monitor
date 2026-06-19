import 'dotenv/config'
export const configuration = () => ({
	DATABASE_URL: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
	API_PORT: process.env.API_PORT ?? '4000',
	WEB_ORIGIN: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
	RSSHUB_BASE_URL: process.env.RSSHUB_BASE_URL ?? 'https://rsshub.app',
	X_BEARER_TOKEN: process.env.X_BEARER_TOKEN ?? '',
	DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? '',
	DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
	DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash',
	DEEPSEEK_STRICT_MODEL: process.env.DEEPSEEK_STRICT_MODEL ?? 'deepseek-v4-pro',
	KEYWORD_INTERVAL_MINUTES: process.env.KEYWORD_INTERVAL_MINUTES ?? '10',
	TRENDS_INTERVAL_MINUTES: process.env.TRENDS_INTERVAL_MINUTES ?? '60'
})
