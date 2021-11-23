import { ClientEvents } from "discord.js";
import BetterClient from "../extensions/BetterClient.js";

export default class EventHandler {
	public readonly name: keyof ClientEvents;
	public readonly client: BetterClient;
	private _listener;
	constructor(client: BetterClient, name: keyof ClientEvents) {
		this.name = name;
		this.client = client;
		this._listener = this._run.bind(this);
	}

	private async _run(...args: any) {
		try {
			return this.run(...args);
		} catch (error) {
			this.client.logger.error(error);
			this.client.logger.sentry.captureWithExtras(error, {
				Event: this.name,
				Arguments: args
			});
		}
	}

	public async run(...args: any): Promise<any> {}

	public listen() {
		return this.client.on(this.name, this._listener);
	}

	public removeListener() {
		return this.client.off(this.name, this._listener);
	}
}
