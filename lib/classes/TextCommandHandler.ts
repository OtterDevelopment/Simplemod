import TextCommand from "./TextCommand.js";
import { Message, Snowflake } from "discord.js";
import BetterClient from "../extensions/BetterClient.js";

export default class TextCommandHandler {
	private readonly client: BetterClient;
	private readonly coolDownTime: number;
	private coolDowns: Set<Snowflake>;
	constructor(client: BetterClient) {
		this.client = client;

		this.coolDownTime = 1000;
		this.coolDowns = new Set();
	}

	public loadCommands() {
		this.client.functions
			.getFiles(`${this.client.__dirname}/dist/src/bot/textCommands`, "", true)
			.forEach((parentFolder) =>
				this.client.functions
					.getFiles(`${this.client.__dirname}/dist/src/bot/textCommands/${parentFolder}`, ".js")
					.forEach(async (fileName) => {
						const commandFile = await import(`../../src/bot/textCommands/${parentFolder}/${
							fileName
						}`);
						const command: TextCommand = new commandFile.default(this.client);
						return this.client.textCommands.set(command.name, command);
					})
			);
	}

	private fetchCommand(name: string): TextCommand | undefined {
		return this.client.textCommands.get(name);
	}

	public async handleCommand(message: Message) {
		if (
			!message.content.startsWith(`<@${this.client.user?.id}>`) &&
			!message.content.startsWith(`<!@${this.client.user?.id}>`)
		)
			return;
		const args = message.content.slice(23).trim().split(/ +/g);
		const commandName = args.shift()?.toLowerCase();
		const command = this.fetchCommand(commandName!);
		if (!command) return;

		const missingPermissions = command.validate(message);
		if (missingPermissions)
			return message.reply(
				this.client.functions.generateErrorMessage({
					title: "Missing Permissions",
					description: missingPermissions
				})
			);

		return this.runCommand(command, message, args);
	}

	private async runCommand(command: TextCommand, message: Message, args: string[]) {
		if (this.coolDowns.has(message.author.id))
			return message.reply(
				this.client.functions.generateErrorMessage({
					title: "Command Cooldown",
					description: "Please wait a second before running this command again!"
				})
			);

		this.client.usersUsingBot.add(message.author.id);
		command
			.run(message, args)
			.then(() => this.client.usersUsingBot.delete(message.author.id))
			.catch(async (error): Promise<any> => {
				this.client.logger.error(error);
				const sentryId = await this.client.logger.sentry.captureWithMessage(error, message);
				return message.reply(
					this.client.functions.generateErrorMessage({
						title: "An Error Has Occurred",
						description: `An unexpected error was encountered while running \`${command.name}\`, my developers have already been notified! Feel free to join my support server in the mean time!`,
						footer: { text: `Sentry Event ID: ${sentryId} ` }
					})
				);
			});
		this.coolDowns.add(message.author.id);
		setTimeout(() => this.coolDowns.delete(message.author.id), this.coolDownTime);
	}
}
