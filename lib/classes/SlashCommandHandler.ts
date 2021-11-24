import SlashCommand from "./SlashCommand";
import BetterClient from "../extensions/BetterClient.js";
import { CommandInteraction, Snowflake } from "discord.js";

export default class SlashCommandHandler {
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
			.getFiles(`${this.client.__dirname}/dist/src/bot/slashCommands`, "", true)
			.forEach((parentFolder) =>
				this.client.functions
					.getFiles(`${this.client.__dirname}/dist/src/bot/slashCommands/${parentFolder}`, ".js")
					.forEach(async (fileName) => {
						const commandFile = await import(`../../src/bot/slashCommands/${parentFolder}/${
							fileName
						}`);
						const command: SlashCommand = new commandFile.default(this.client);
						return this.client.slashCommands.set(command.name, command);
					})
			);
		return setTimeout(() => {
			this.client.guilds.cache.forEach((guild) => {
				try {
					guild.commands.set(
						this.client.slashCommands.map((command) => {
							return {
								name: command.name,
								description: command.description,
								options: command.options
							};
						})
					);
				} catch (error: any) {
					if (error.code === 50001)
						this.client.logger.error(
							"",
							`I encountered DiscordAPIError: Missing Access in ${guild.name} [${guild.name}] when trying to set slash commands!`
						);
					else {
						this.client.logger.error(error);
						this.client.logger.sentry.captureWithExtras(error, {
							Guild: guild.name,
							"Guild ID": guild.id,
							"Slash Command Count": this.client.slashCommands.size,
							"Slash Commands": this.client.slashCommands.map((command) => {
								return {
									name: command.name,
									description: command.description,
									options: command.options
								};
							})
						});
					}
				}
			});
		}, 5000);
	}

	private fetchCommand(name: string): SlashCommand | undefined {
		return this.client.slashCommands.get(name);
	}

	public async handleCommand(interaction: CommandInteraction) {
		const command = this.fetchCommand(interaction.commandName);
		if (!command) {
			this.client.logger.debug(
				`${interaction.user.tag} [${interaction.user.id}] invoked slash command ${interaction.commandName} even though it doesn't exist.`
			);
			const sentryId = await this.client.logger.sentry.captureWithInteraction(
				new Error(`Non existent command invoked`),
				interaction
			);

			this.client.guilds.cache.forEach((guild) => {
				try {
					guild.commands.delete(interaction.commandName);
				} catch (error: any) {
					if (error.code === 50001)
						this.client.logger.error(
							"",
							`I encountered DiscordAPIError: Missing Access in ${guild.name} [${guild.name}] when trying to remove non existent slash command ${interaction.commandName}!`
						);
					else {
						this.client.logger.error(error);
						this.client.logger.sentry.captureWithExtras(error, {
							Guild: guild.name,
							"Guild ID": guild.id,
							"Slash Command Count": this.client.slashCommands.size,
							"Slash Commands": this.client.slashCommands.map((command) => {
								return {
									name: command.name,
									description: command.description,
									options: command.options
								};
							})
						});
					}
				}
			});
			return interaction.reply(
				this.client.functions.generateErrorMessage(
					{
						title: "Non Existent Command",
						description: `The command \`${interaction.commandName}\` doesn't exist on this instance of ${this.client.user?.username}, this has already been reported to my developers and the command has been removed!`,
						footer: { text: `Sentry Event ID: ${sentryId} ` }
					},
					true
				)
			);
		}

		const missingPermissions = command.validate(interaction);
		if (missingPermissions)
			return interaction.reply(
				this.client.functions.generateErrorMessage({
					title: "Missing Permissions",
					description: missingPermissions
				})
			);

		return this.runCommand(command, interaction);
	}

	private async runCommand(command: SlashCommand, interaction: CommandInteraction): Promise<any> {
		if (this.coolDowns.has(interaction.user.id))
			return interaction.reply(
				this.client.functions.generateErrorMessage({
					title: "Command Cooldown",
					description: "Please wait a second before running this command again!"
				})
			);

		this.client.usersUsingBot.add(interaction.user.id);
		command
			.run(interaction)
			.then(() => this.client.usersUsingBot.delete(interaction.user.id))
			.catch(async (error): Promise<any> => {
				this.client.logger.error(error);
				const sentryId = await this.client.logger.sentry.captureWithInteraction(
					error,
					interaction
				);
				const toSend = this.client.functions.generateErrorMessage(
					{
						title: "An Error Has Occurred",
						description: `An unexpected error was encountered while running \`${interaction.commandName}\`, my developers have already been notified! Feel free to join my support server in the mean time!`,
						footer: { text: `Sentry Event ID: ${sentryId} ` }
					},
					true
				);
				if (interaction.replied) return interaction.followUp(toSend);
				else return interaction.reply({ ...toSend, ephemeral: true });
			});
		this.coolDowns.add(interaction.user.id);
		setTimeout(() => this.coolDowns.delete(interaction.user.id), this.coolDownTime);
	}
}
