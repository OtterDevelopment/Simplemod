import { SlashCommandOptions } from "../../typings";
import BetterClient from "../extensions/BetterClient.js";
import { ApplicationCommandOptionData, CommandInteraction, PermissionString } from "discord.js";

export default class SlashCommand {
	public readonly name: string;
	public readonly description: string;
	public readonly options: ApplicationCommandOptionData[];
	private readonly permissions: PermissionString[];
	private readonly clientPermissions: PermissionString[];
	private readonly devOnly: boolean;
	private readonly guildOnly: boolean;
	private readonly ownerOnly: boolean;
	public readonly client: BetterClient;
	constructor(name: string, client: BetterClient, options: SlashCommandOptions) {
		this.name = name;
		this.description = options.description || "";
		this.options = options.options || [];

		this.permissions = options.permissions || [];
		this.clientPermissions = client.config.requiredPermissions.concat(
			options.clientPermissions || []
		);

		this.devOnly = options.devOnly || false;
		this.guildOnly = options.guildOnly || false;
		this.ownerOnly = options.ownerOnly || false;

		this.client = client;
	}

	public validate(interaction: CommandInteraction): string | null {
		if (this.guildOnly && !interaction.inGuild())
			return "This command can only be used in guilds!";
		else if (this.ownerOnly && interaction.guild?.ownerId !== interaction.user.id)
			return "This command can only be ran by the owner of this guild!";
		else if (this.devOnly && !this.client.config.admins)
			return "This command can only be ran by my developer!";
		else if (this.permissions && !interaction.memberPermissions?.has(this.permissions))
			return `You need ${this.permissions.length > 1 ? "" : "the"} ${this.permissions
				.map((permission) => `**${this.client.functions.getPermissionName(permission)}**`)
				.join(", ")} permission${
				this.permissions.length > 1 ? "s" : ""
			} to run this command.`;
		else if (
			this.clientPermissions &&
			!interaction.memberPermissions?.has(this.clientPermissions)
		)
			return `You need ${this.permissions.length > 1 ? "" : "the"} ${this.permissions
				.map((permission) => `**${this.client.functions.getPermissionName(permission)}**`)
				.join(", ")} permission${
				this.permissions.length > 1 ? "s" : ""
			} to run this command.`;
		return null;
	}

	public async run(interaction: CommandInteraction): Promise<any> {}
}
