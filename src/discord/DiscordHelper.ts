const { Routes } = require("discord.js");
import Discord, { IntentsBitField, REST, TextBasedChannel } from "discord.js";
import EnvironmentVariables from "../utils/EnvironmentVariables";
import { leave, multiban, register, toggleban } from "./interactions";

export default class DiscordHelper {
    static client: Discord.Client;

    static channel: TextBasedChannel;

    private static initCommands() {
        let commands = [];

        commands.push({
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
            name: "register",
            description: "Register your Twitch account to the system",
        });

        commands.push({
            name: "toggleban",
            description:
                "Toggles if bans happen on your account, account information is sustained",
        });

        commands.push({
            name: "leave",
            description:
                "Disables banning on your account and removes all account information",
        });

        const rest = new REST({ version: "10" }).setToken(
            EnvironmentVariables.DISCORD_BOT_TOKEN
        );
        (async () => {
            try {
                console.log(`Pushing commands to discord`);

                // The put method is used to fully refresh all commands in the guild with the current set
                await rest.put(
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

    public static initialiseDiscord(): Promise<void> {
        return new Promise((resolve, reject) => {
            let myIntents = new IntentsBitField();
            this.client = new Discord.Client({
                intents: myIntents,
            });

            this.client.on("ready", () => {
                console.log(`${this.client.user?.tag} has logged in`);
                this.initCommands();
                resolve();
            });

            this.client.on("interactionCreate", async (interaction) => {
                try {
                    if (interaction.isChatInputCommand()) {
                        const { commandName } = interaction;
                        console.log(
                            "New chat input interaction: " + commandName
                        );
                        switch (commandName) {
                            case "register":
                                register(interaction);
                                break;
                            case "multiban":
                                multiban(interaction);
                                break;
                            case "toggleban":
                                toggleban(interaction);
                                break;
                            case "leave":
                                leave(interaction);
                                break;
                        }
                    }
                } catch (e) {
                    console.error(
                        "Something went wrong on creating interaction: " + e
                    );
                }
            });

            this.client.login(process.env.DISCORD_BOT_TOKEN);
        });
    }
}
