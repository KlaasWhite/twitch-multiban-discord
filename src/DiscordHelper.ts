const { Routes } = require("discord.js");
import Discord, {
    IntentsBitField,
    InteractionReplyOptions,
    REST,
    TextBasedChannel,
} from "discord.js";
import UserData from "./UserData";
import EnvironmentVariables from "./utils/EnvironmentVariables";
import TwitchAuthorisation from "./twitch/TwitchAuthorisation";
import TwitchApiRequests from "./twitch/TwitchApiRequests";

export default class DiscordHelper {
    static client: Discord.Client;

    static channel: TextBasedChannel;

    private static initCommands() {
        let commands = [];

        commands.push({
            default_permission: true,
            name: "multiban",
            description: "Music module",
            options: [
                {
                    name: "user",
                    description: "user to ban",
                    type: 3,
                    required: true,
                },
            ],
        });

        commands.push({
            default_permission: true,
            name: "register",
            description: "Register your Twitch account to the system",
        });

        const rest = new REST({ version: "10" }).setToken(
            EnvironmentVariables.DISCORD_BOT_TOKEN
        );
        (async () => {
            try {
                console.log(`Started refreshing application (/) commands.`);

                // The put method is used to fully refresh all commands in the guild with the current set
                const data = await rest.put(
                    Routes.applicationGuildCommands(
                        EnvironmentVariables.DISCORD_CLIENT_ID,
                        EnvironmentVariables.DISCORD_SERVER
                    ),
                    { body: commands }
                );
            } catch (error) {
                // And of course, make sure you catch and log any errors!
                console.error(error);
            }
        })();
    }

    public static initialiseDiscord() {
        let myIntents = new IntentsBitField();
        this.client = new Discord.Client({
            intents: myIntents,
        });

        this.client.on("ready", () => {
            console.log(`${this.client.user?.tag} has logged in`);
            this.initCommands();
        });

        this.client.on("interactionCreate", async (interaction) => {
            console.log("New interaction");
            if (interaction.isCommand()) {
                const { commandName } = interaction;
                console.log(commandName);
                switch (commandName) {
                    case "register":
                        UserData.addUser(interaction.user.id);
                        const url = TwitchAuthorisation.startUserAuthorisation(
                            interaction.user.id
                        );
                        const interactionReplyOption: InteractionReplyOptions =
                            {
                                content: url,
                                ephemeral: true,
                            };
                        interaction.reply(interactionReplyOption);
                        break;
                    case "multiban":
                        const user = interaction.options.get("user")
                            ?.value as string;
                        console.log("multiban called with user: " + user);
                        await interaction.reply("User is being been banned");
                        try {
                            TwitchApiRequests.banUserInAllRegisteredChannels(
                                user
                            ).then(() => {
                                const interactionReplyOption: InteractionReplyOptions =
                                    {
                                        content: "user has been banned",
                                    };
                                interaction.followUp(interactionReplyOption);
                            });
                        } catch (error) {
                            console.error(error);
                        }

                        break;
                }
            }
        });

        this.client.login(process.env.DISCORD_BOT_TOKEN);
    }
}
