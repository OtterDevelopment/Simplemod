import {
	ChannelLogsQueryOptions,
	Collection,
	CommandInteraction,
	GuildTextBasedChannel,
	Message,
	Snowflake,
	User
} from "discord.js";
import SlashCommand from "../../../../lib/classes/SlashCommand.js";
import BetterClient from "../../../../lib/extensions/BetterClient.js";

export default class Purge extends SlashCommand {
	constructor(client: BetterClient) {
		super("purge", client, {
			description: `Delete a large amount of messages that meet a certain criteria.`,
			permissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
			options: [
				{
					name: "amount",
					type: "INTEGER",
					description: "The amount of messages to look through.",
					required: true,
					minValue: 1,
					maxValue: 1000
				},
				{
					name: "channel",
					type: "CHANNEL",
					description: "The channel to purge messages in.",
					channelTypes: [
						"GUILD_TEXT",
						"GUILD_NEWS",
						"GUILD_PUBLIC_THREAD",
						"GUILD_PRIVATE_THREAD",
						"GUILD_NEWS_THREAD"
					]
				},
				{
					name: "reason",
					type: "STRING",
					description: "The reason for this purge."
				},
				{
					name: "silent",
					type: "BOOLEAN",
					description:
						"If set to true, the bot will send an ephermal message instead of just a normal one."
				},
				{
					name: "user",
					type: "USER",
					description: "Only purge messages by this user."
				},
				{
					name: "match",
					type: "STRING",
					description:
						"Only purge messages that have a certain phrase string them. (Regex supported)"
				},
				{
					name: "nomatch",
					type: "STRING",
					description:
						"Only purge messages that don't have a certain string within them. (Regex supported)"
				},
				{
					name: "role",
					type: "ROLE",
					description: "Only purge messages by users with this role."
				},
				{
					name: "embeds",
					type: "BOOLEAN",
					description: "Only purge messages with embeds."
				},
				{
					name: "attachments",
					type: "BOOLEAN",
					description: "Only purge messages with attachments."
				},
				{
					name: "bots",
					type: "BOOLEAN",
					description: "Only purge messages from bots."
				},
				{
					name: "mentions",
					type: "MENTIONABLE",
					description: "Only purge messages that mention a user or role."
				},
				{
					name: "before",
					type: "STRING",
					description: "Only purge messages before this message."
				},
				{
					name: "after",
					type: "STRING",
					description: "Only purge messages after this message."
				},
				{
					name: "delete_pinned",
					type: "BOOLEAN",
					description: "Delete pinned messages."
				}
			]
		});
	}

	override async run(interaction: CommandInteraction) {
		const channel = (interaction.options.getChannel("channel") ||
			interaction.channel) as GuildTextBasedChannel;
		if (
			!channel.viewable ||
			!channel
				.permissionsFor(channel.guild.me!)
				.has(["READ_MESSAGE_HISTORY", "MANAGE_MESSAGES"])
		)
			return interaction.reply(
				this.client.functions.generateErrorMessage({
					title: "Missing Permissions",
					description:
						"I can't read messages in that channel, please make sure I have the **View Channel**, **Read Message History**, and **Manage Messages** permissions!"
				})
			);
		const amount = interaction.options.getInteger("amount")!;
		const before = interaction.options.getString("before");
		const after = interaction.options.getString("after");
		const messages = new Collection<Snowflake, Message<boolean>>();
		for (const message of (
			await channel.messages.fetch({
				limit: amount,
				before,
				after
			} as ChannelLogsQueryOptions)
		).values()) {
			// The logic for this chunk of code was heavily inspired by Geek @ FireDiscordBot, the options were original but also matched the ones Geek had made.
			// Repo @ https://github.com/FireDiscordBot/bot
			let completed = [];
			if (message.pinned && !interaction.options.getBoolean("delete_pinned")) continue;
			if (interaction.options.getUser("user"))
				completed.push(interaction.options.getUser("user")!.id === message.author.id);
			if (interaction.options.getString("match")) {
				const matches = await this.client.executeRegex(
					new RegExp(interaction.options.getString("match")!, "gi"),
					message.content
				);
				completed.push(matches !== null && matches.length > 0);
			}
			if (interaction.options.getString("nomatch")) {
				const matches = await this.client.executeRegex(
					new RegExp(interaction.options.getString("nomatch")!, "gi"),
					message.content
				);
				completed.push(matches !== null && matches.length === 0);
			}
			if (interaction.options.getRole("role"))
				completed.push(
					message.member?.roles.cache.get(interaction.options.getRole("role")!.id)
				);
			if (interaction.options.getBoolean("embeds") !== null)
				completed.push(
					interaction.options.getBoolean("embeds")
						? message.embeds.length > 0
						: message.embeds.length === 0
				);
			if (interaction.options.getBoolean("attachments") !== null)
				completed.push(
					interaction.options.getBoolean("attachments")
						? message.attachments.size > 0
						: message.attachments.size === 0
				);
			if (interaction.options.getBoolean("bots") !== null)
				completed.push(interaction.options.getBoolean("bots") === message.author.bot);
			if (interaction.options.getMentionable("mentions"))
				completed.push(
					[
						// @ts-ignore
						`<@!${interaction.options.getMentionable("mentions")!.id}>`,
						interaction.options.getMentionable("mentions")!.toString()
					].some((mention) => message.content.includes(mention))
				);
			if (completed.every((c) => c)) messages.set(message.id, message);
		}
		let deleted = new Collection<Snowflake, Message>();
		if (messages.size === 0)
			return interaction.reply(
				this.client.functions.generateErrorMessage({
					title: "No Messages Match Criteria",
					description: "There are no messages that match the criteria you provided!"
				})
			);
		else if (messages.size === 1) {
			const d = await messages.first()!.delete();
			deleted.set(d.id, d);
		} else deleted = await channel.bulkDelete(messages, true);
		this.client.emit(
			"purge",
			interaction.guild,
			interaction.member,
			messages,
			interaction.options.getString("reason")
		);
		let users = new Collection<Snowflake, User>();
		let purgedUserCount = new Collection<Snowflake, number>();
		deleted.forEach((message) => {
			if (!users.get(message.author.id)) {
				users.set(message.author.id, message.author);
				purgedUserCount.set(message.author.id, 0);
			}
			purgedUserCount.set(message.author.id, purgedUserCount.get(message.author.id)! + 1);
		});
		return interaction.reply(
			this.client.functions.generateSuccessMessage(
				{
					title: "Messages Purged",
					description: `Purged ${deleted.size} messages!\n\n${purgedUserCount
						.map((count, userId) => `**${users.get(userId)!.tag}:** ${count}`)
						.join("\n")}`
				},
				[],
				interaction.options.getBoolean("silent") || false
			)
		);
	}
}
