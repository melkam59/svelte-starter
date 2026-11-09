// The one place that reads environment variables. They are checked when the server starts.
export {
	APP_NAME,
	APP_VERSION,
	BETTER_AUTH_SECRET,
	DATABASE_URL,
	LOG_LEVEL,
	METRICS_TOKEN,
	ORIGIN,
	SERVICE_NAME
} from '$app/env/private';
export { building, dev } from '$app/env';
