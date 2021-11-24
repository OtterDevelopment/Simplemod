import {
	ApplicationCommandData,
	ApplicationCommandOptionData,
	GuildMember,
	MessageActionRow,
	MessageEmbed,
	PermissionString
} from "discord.js";

export interface SlashCommandOptions {
	description?: string;
	options?: ApplicationCommandOptionData[];
	permissions?: PermissionString[];
	clientPermissions?: PermissionString[];
	devOnly?: boolean;
	guildOnly?: boolean;
	ownerOnly?: boolean;
}

export interface TextCommandOptions {
	description: string;
	aliases?: string[];
	permissions?: PermissionString[];
	clientPermissions?: PermissionString[];
	devOnly?: boolean;
	guildOnly?: boolean;
	ownerOnly?: boolean;
}

export interface ButtonOptions {
	permissions: PermissionString[];
	clientPermissions: PermissionString[];
	devOnly?: boolean;
	guildOnly?: boolean;
	ownerOnly?: boolean;
}

export interface ButtonOptions {
	permissions: PermissionString[];
	clientPermissions: PermissionString[];
	devOnly?: boolean;
	guildOnly?: boolean;
	ownerOnly?: boolean;
}

export interface GeneratedMessage {
	embeds: MessageEmbed[];
	components: MessageActionRow[];
	ephermal: boolean;
}

export interface Stats {
	messageCount: number;
	commandsRun: number;
}

export interface CachedStats {
	guilds: number;
	users: number;
	cachedUsers: number;
	channels: number;
	roles: number;
}

export interface GenerateTimestampOptions {
	timestamp?: Date | number;
	type?: "t" | "T" | "d" | "D" | "f" | "F" | "R";
}
