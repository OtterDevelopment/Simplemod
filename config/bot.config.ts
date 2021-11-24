import { Intents, PermissionString } from "discord.js";

export default {
	version: "1.0.0",
	admins: [""],

	supportServer: "https://discord.gg/VvE5ucuJmW",
	minimalInvite:
		"https://discord.com/api/oauth2/authorize?client_id=635294447697002506&permissions=292556957910&redirect_uri=https%3A%2F%2Fdiscord.gg%2FVvE5ucuJmW&scope=applications.commands%20bot",
	recommendedInvite:
		"https://discord.com/api/oauth2/authorize?client_id=635294447697002506&permissions=8&redirect_uri=https%3A%2F%2Fdiscord.gg%2FVvE5ucuJmW&scope=applications.commands%20bot",

	hastebin: "https://h.inv.wtf",

	colors: {
		primary: "5865F2",
		success: "57F287",
		warning: "FEE75C",
		error: "ED4245"
	},

	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_BANS,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS
	],

	requiredPermissions: [
		"EMBED_LINKS",
		"SEND_MESSAGES",
		"USE_EXTERNAL_EMOJIS"
	] as PermissionString[],

	apiKeys: {},

	emojis: {
		checkMark: "<:checkmark:821639187194970133>",
		xMark: "<:xmark:821639187328663612>"
	}
};
