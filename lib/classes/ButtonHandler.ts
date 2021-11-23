import Button from "./Button.js";
import { ButtonInteraction } from "discord.js";
import BetterClient from "../extensions/BetterClient.js";

export default class ButtonHandler {
	private readonly client: BetterClient;
	private readonly coolDownTime: number;
	private readonly coolDowns: Set<string>;
	constructor(client: BetterClient) {
		this.client = client;

		this.coolDownTime = 1000;
		this.coolDowns = new Set();
	}

	public loadButtons() {
		this.client.functions
			.getFiles(`${this.client.__dirname}/dist/src/bot/buttons`, "", true)
			.forEach((parentFolder) =>
				this.client.functions
					.getFiles(`${this.client.__dirname}/dist/src/bot/buttons/${parentFolder}`, ".js")
					.forEach(async (fileName) => {
						const buttonFile = await import(`../../src/bot/buttons/${parentFolder}/${
							fileName
						}`);
						const button: Button = new buttonFile.default(this.client);
						return this.client.buttons.set(button.name, button);
					})
			);
	}

	private fetchButton(customId: string): Button | undefined {
		return this.client.buttons.find((button) => customId.startsWith(button.name));
	}

	public async handleButton(interaction: ButtonInteraction) {
		const button = this.fetchButton(interaction.customId);
		if (!button) return;

		const missingPermissions = button.validate(interaction);
		if (missingPermissions)
			return interaction.reply(
				this.client.functions.generateErrorMessage({
					title: "Missing Permissions",
					description: missingPermissions
				})
			);

		return this.runButton(button, interaction);
	}

	private async runButton(button: Button, interaction: ButtonInteraction): Promise<any> {
		if (this.coolDowns.has(interaction.user.id))
			return interaction.reply(
				this.client.functions.generateErrorMessage({
					title: "Command Cooldown",
					description: "Please wait a second before running this button again!"
				})
			);

		this.client.usersUsingBot.add(interaction.user.id);
		button
			.run(interaction)
			.then(() => this.client.usersUsingBot.delete(interaction.user.id))
			.catch((error): Promise<any> => {
				this.client.logger.error(error);
				const sentryId = this.client.logger.sentry.captureWithInteraction(
					error,
					interaction
				);
				const toSend = this.client.functions.generateErrorMessage(
					{
						title: "An Error Has Occurred",
						description: `An unexpected error was encountered while running this button, my developers have already been notified! Feel free to join my support server in the mean time!`,
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
