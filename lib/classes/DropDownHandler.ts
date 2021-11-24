import DropDown from "./DropDown.js";
import { SelectMenuInteraction } from "discord.js";
import BetterClient from "../extensions/BetterClient.js";

export default class DropdownHandler {
	private readonly client: BetterClient;
	private readonly coolDownTime: number;
	private readonly coolDowns: Set<string>;
	constructor(client: BetterClient) {
		this.client = client;

		this.coolDownTime = 1000;
		this.coolDowns = new Set();
	}

	public loadDropDowns(): void {
		this.client.functions
			.getFiles(`${this.client.__dirname}/dist/src/bot/dropDowns`, "", true)
			.forEach((parentFolder) =>
				this.client.functions
					.getFiles(`${this.client.__dirname}/dist/src/bot/dropDowns`, ".js")
					.forEach(async (fileName) => {
						console.log(parentFolder, fileName);
						const dropDownFile = await import(`../../src/bot/buttons/${parentFolder}/${
							fileName
						}`);
						const dropDown: DropDown = new dropDownFile.default(this.client);
						return this.client.dropDowns.set(dropDown.name, dropDown);
					})
			);
	}

	private fetchDropDown(customId: string): DropDown | undefined {
		return this.client.dropDowns.find((dropDown) => customId.startsWith(dropDown.name));
	}

	public async handleDropDown(interaction: SelectMenuInteraction) {
		const dropDown = this.fetchDropDown(interaction.message!.id);
		if (!dropDown) return;

		const missingPermissions = dropDown.validate(interaction);
		if (missingPermissions)
			return interaction.reply(
				this.client.functions.generateErrorMessage({
					title: "Missing Permissions",
					description: missingPermissions
				})
			);

		return dropDown.run(interaction);
	}

	private async runDropDown(
		dropdown: DropDown,
		interaction: SelectMenuInteraction
	): Promise<any> {
		if (this.coolDowns.has(interaction.user.id))
			return interaction.reply(
				this.client.functions.generateErrorMessage({
					title: "Command Cooldown",
					description: "Please wait a second before running this button again!"
				})
			);

		this.client.usersUsingBot.add(interaction.user.id);
		dropdown
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
						description: `An unexpected error was encountered while running this drop down, my developers have already been notified! Feel free to join my support server in the mean time!`,
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
