import { load } from "dotenv-extended";
import { ShardingManager } from "discord.js";
import Config from "../config/bot.config.js";
import Logger from "../lib/classes/Logger.js";

load();

const _version = process.env.NODE_ENV === "development" ? `${Config.version}-dev` : Config.version;

const manager = new ShardingManager("./dist/src/bot/bot.js", {
	token: process.env.DISCORD_TOKEN
});

Logger.info(`Starting Cruiseship ${_version}`);

manager.spawn({
	timeout: -1
});

manager.on("shardCreate", (shard) => {
	Logger.info(`Starting Shard ${shard.id}.`);
	if (shard.id + 1 === manager.totalShards) {
		shard.once("ready", () => {
			setTimeout(() => {
				Logger.info("All shards are online and ready!");
			}, 200);
		});
	}
});
