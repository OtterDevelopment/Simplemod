import { Message } from "discord.js";
import EventHandler from "../../../lib/classes/EventHandler.js";

export default class MessageCreate extends EventHandler {
	override async run(message: Message) {
		if (message.author.bot) return;
		// @ts-ignore
		else if (this.client.mongo.topology.s.state !== "connected")
			return message.reply(
				this.client.functions.generateErrorMessage(
					{
						title: "Not Ready",
						description: "I'm not ready yet, please try again in a moment!"
					},
					true,
					[],
					false
				)
			);
		return this.client.textCommandHandler.handleCommand(message);
	}
}
