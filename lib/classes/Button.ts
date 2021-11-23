import { ButtonOptions } from "../../typings";
import BetterClient from "../extensions/BetterClient.js";
import { ButtonInteraction, PermissionString } from "discord.js";

export default class Button {
	public readonly name: string;
	private readonly permissions: PermissionString[];
	private readonly clientPermissions: PermissionString[];
	private readonly devOnly: boolean;
	private readonly guildOnly: boolean;
	private readonly ownerOnly: boolean;
	private readonly client: BetterClient;
	constructor(name: string, client: BetterClient, options: ButtonOptions) {
		this.name = name;

		this.permissions = options.permissions || [];
		this.clientPermissions = options.clientPermissions || [];

		this.devOnly = options.devOnly || false;
		this.guildOnly = options.guildOnly || false;
		this.ownerOnly = options.ownerOnly || false;

		this.client = client;
	}

	public validate(interaction: ButtonInteraction): string | null {
		if (this.guildOnly && !interaction.inGuild())
			return "This button can only be used in guilds!";
		else if (this.ownerOnly && interaction.guild?.ownerId !== interaction.user.id)
			return "This button can only be ran by the owner of this guild!";
		else if (this.devOnly && !this.client.config.admins)
			return "This button can only be ran by my developer!";
		else if (this.permissions && !interaction.memberPermissions?.has(this.permissions))
			return `You need ${this.permissions.length > 1 ? "" : "the"} ${this.permissions
				.map((permission) => `**${this.client.functions.getPermissionName(permission)}**`)
				.join(", ")} permission${
				this.permissions.length > 1 ? "s" : ""
			} to run this button.`;
		else if (
			this.clientPermissions &&
			!interaction.memberPermissions?.has(this.clientPermissions)
		)
			return `You need ${this.permissions.length > 1 ? "" : "the"} ${this.permissions
				.map((permission) => `**${this.client.functions.getPermissionName(permission)}**`)
				.join(", ")} permission${
				this.permissions.length > 1 ? "s" : ""
			} to run this button.`;
		return null;
	}

	public async run(interaction: ButtonInteraction): Promise<void> {}
}
