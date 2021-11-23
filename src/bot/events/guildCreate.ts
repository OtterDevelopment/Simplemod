import { Guild } from "discord.js";
import EventHandler from "../../../lib/classes/EventHandler.js";

export default class GuildCreate extends EventHandler {
	override async run(guild: Guild) {
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
				this.client.logger.debug(
					`I encountered DiscordAPIError: Missing Access in ${guild.name} [${guild.id}] when trying to set slash commands!`
				);
			else {
				this.client.logger.error(error);
				this.client.logger.sentry.captureWithExtras(error, {
					guild: guild
				});
			}
		}
		this.client.logger.info(
			`Joined guild ${guild.name} (${guild.id}) with ${guild.memberCount} members, now in ${
				(await this.client.fetchStats()).guilds
			} guilds(s)!`
		);
		return this.client.logger.webhookLog("guild", {
			content: `**__Joined a New Guild (${
				(await this.client.fetchStats()).guilds
			} Total)__**\n**Guild Name:** \`${guild.name}\`\n**Guild ID:** \`${
				guild.id
			}\`\n**Guild Owner:** <@${guild.ownerId}> \`[${
				guild.ownerId
			}]\`\n**Guild Member Count:** \`${
				guild.memberCount || 2
			}\`\n**Timestamp:** ${this.client.functions.generateTimestamp()}`,
			username: `${this.client.user?.username} | Guild Logs`
		});
	}
}
