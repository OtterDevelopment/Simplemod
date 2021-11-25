import path from "path";
import { MongoClient } from "mongodb";
import Button from "../classes/Button.js";
import { TimeoutError, RegExpWorker } from "regexp-worker";
import DropDown from "../classes/DropDown.js";
import * as Logger from "../classes/Logger.js";
import Config from "../../config/bot.config.js";
import Functions from "../utilities/functions.js";
import { CachedStats, Stats } from "../../typings";
import TextCommand from "../classes/TextCommand.js";
import EventHandler from "../classes/EventHandler.js";
import SlashCommand from "../classes/SlashCommand.js";
import ButtonHandler from "../classes/ButtonHandler.js";
import DropDownHandler from "../classes/DropDownHandler.js";
import { Client, ClientOptions, Collection } from "discord.js";
import TextCommandHandler from "../classes/TextCommandHandler.js";
import SlashCommandHandler from "../classes/SlashCommandHandler.js";

export default class BetterClient extends Client {
	public usersUsingBot: Set<string>;
	public readonly config;
	public readonly functions: Functions;
	public readonly logger: Logger.Logger;
	public readonly slashCommandHandler: SlashCommandHandler;
	public slashCommands: Collection<string, SlashCommand>;
	public readonly textCommandHandler: TextCommandHandler;
	public textCommands: Collection<string, TextCommand>;
	public readonly buttonHandler: ButtonHandler;
	public buttons: Collection<string, Button>;
	public readonly dropDownHandler: DropDownHandler;
	public dropDowns: Collection<string, DropDown>;
	public events: Map<string, EventHandler>;
	public readonly mongo: MongoClient;
	public readonly version: string;
	public stats: Stats;
	public cachedStats: CachedStats;
	public readonly __dirname: string;
	public readonly regexWorker: RegExpWorker;
	constructor(options: ClientOptions) {
		super(options);

		this.__dirname = path.resolve();

		this.regexWorker = new RegExpWorker(100);

		this.usersUsingBot = new Set();
		this.config = Config;
		this.functions = new Functions(this);
		this.logger = Logger.default;

		this.slashCommandHandler = new SlashCommandHandler(this);
		this.slashCommands = new Collection();

		this.textCommandHandler = new TextCommandHandler(this);
		this.textCommands = new Collection();

		this.buttonHandler = new ButtonHandler(this);
		this.buttons = new Collection();

		this.dropDownHandler = new DropDownHandler(this);
		this.dropDowns = new Collection();

		this.events = new Map();

		this.mongo = new MongoClient(process.env.MONGO_URI);

		this.version =
			process.env.NODE_ENV === "development"
				? `${this.config.version}-dev`
				: this.config.version;

		this.stats = {
			messageCount: 0,
			commandsRun: 0
		};

		this.cachedStats = {
			guilds: 0,
			users: 0,
			cachedUsers: 0,
			channels: 0,
			roles: 0
		};

		this.dropDownHandler.loadDropDowns();
		this.buttonHandler.loadButtons();
		this.slashCommandHandler.loadCommands();
		this.textCommandHandler.loadCommands();
		this.loadEvents();
	}

	override async login() {
		await this.mongo.connect();
		return super.login();
	}

	private loadEvents() {
		return this.functions
			.getFiles(`${(this, this.__dirname)}/dist/src/bot/events`, ".js", true)
			.forEach(async (eventFileName) => {
				const eventFile = await import(`./../../src/bot/events/${eventFileName}`);
				const event: EventHandler = new eventFile.default(
					this,
					eventFileName.split(".js")[0]
				);
				event.listen();
				return this.events.set(event.name, event);
			});
	}

	public async fetchStats() {
		const stats = await this.shard?.broadcastEval((client) => {
			return {
				guilds: client.guilds.cache.size,
				users: client.guilds.cache.reduce(
					(previous, guild) => previous + guild.memberCount,
					0
				),
				cachedUsers: client.users.cache.size,
				channels: client.channels.cache.size,
				roles: client.guilds.cache.reduce(
					(previous, guild) => previous + guild.roles.cache.size,
					0
				)
			};
		});

		const reducedStats = stats?.reduce((previous, current) => {
			// @ts-ignore
			Object.keys(current).forEach((key) => (previous[key] += current[key]));
			return previous;
		});
		this.cachedStats = reducedStats || this.cachedStats;
		return reducedStats || this.cachedStats;
	}

	public async executeRegex(regex: RegExp, message: string) {
		try {
			const result = await this.regexWorker.execRegExp(regex, message);
			return result.matches.length || regex.global ? result.matches : null;
		} catch (error: any) {
			if (error.message !== null && error.elapsedTimeMs !== null) return null;
			this.logger.error(error);
			this.logger.sentry.captureWithExtras(error, {
				"Regular Expression": regex,
				Message: message
			});
			return null;
		}
	}
}
