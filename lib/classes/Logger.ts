import {
	bgGreenBright,
	bgMagentaBright,
	bgRedBright,
	bgYellowBright,
	blackBright,
	bold
} from "colorette";
import { format } from "util";
import init from "../utilities/sentry.js";
import { WebhookClient, WebhookMessageOptions } from "discord.js";

export class Logger {
	public readonly sentry;
	private webhooks: Record<string, WebhookClient>;
	constructor() {
		this.sentry = init();
		this.webhooks = {};
	}

	private get timestamp(): string {
		const now = new Date();
		const [year, month, day] = now.toISOString().substr(0, 10).split("-");
		return `${day}/${month}/${year} @ ${now.toISOString().substr(11, 8)}`;
	}

	public debug(...args: string | any) {
		console.log(bold(bgMagentaBright(`[${this.timestamp}]`)), bold(format(...args)));
	}

	public info(...args: string | any) {
		console.log(bold(bgGreenBright(blackBright(`[${this.timestamp}]`))), bold(format(...args)));
	}

	public warn(...args: string | any) {
		console.log(
			bold(bgYellowBright(blackBright(`[${this.timestamp}]`))),
			bold(format(...args))
		);
	}

	public error(error: any, ...args: string | any) {
		console.log(bold(bgRedBright(`[${this.timestamp}]`)), error, bold(format(...args)));
	}

	public async webhookLog(type: string, options: WebhookMessageOptions) {
		if (!type) throw new Error("No webhook type provided!");
		else if (!this.webhooks[type.toLowerCase()]) {
			const webhookURL = process.env[`${type.toUpperCase()}_HOOK`];
			if (!webhookURL) throw new Error(`Invalid webhook type provided!`);
			this.webhooks[type.toLowerCase()] = new WebhookClient({
				url: process.env[`${type.toUpperCase()}_HOOK`]!
			});
		}
		return this.webhooks[type.toLowerCase()]!.send(options);
	}
}

export default new Logger();
