import { format } from "util";
import { load } from "dotenv-extended";
import * as Sentry from "@sentry/node";
import { Interaction, Message } from "discord.js";

load();

export default function init() {
	Sentry.init({
		tracesSampleRate: 1,
		dsn: process.env.SENTRY_DSN
	});

	return {
		...Sentry,

		captureWithInteraction: (error: any, interaction: Interaction): Promise<string> => {
			return new Promise((resolve, _) => {
				Sentry.withScope((scope) => {
					scope.setUser({ username: interaction.user.tag, id: interaction.user.id });
					scope.setExtra("Interaction", format(interaction));

					resolve(Sentry.captureException(error));
				});
			});
		},

		captureWithMessage: (error: any, message: Message): Promise<string> => {
			return new Promise((resolve, _) => {
				Sentry.withScope((scope) => {
					scope.setUser({ username: message.author.tag, id: message.author.id });
					scope.setExtra("Message", format(message));

					resolve(Sentry.captureException(error));
				});
			});
		},

		captureWithExtras: (error: any, extras: Record<string, any>) => {
			return new Promise((resolve, _) => {
				Sentry.withScope((scope) => {
					Object.entries(extras).forEach(([key, value]) =>
						scope.setExtra(key, format(value))
					);
					resolve(Sentry.captureException(error));
				});
			});
		}
	};
}
