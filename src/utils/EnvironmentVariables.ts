import { generateRandomString } from "./functions";

export default class EnvironmentVariables {
    static PORT = "";
    static SERVER_URL = "";

    static DISCORD_BOT_TOKEN = "";
    static DISCORD_SERVER = "";
    static DISCORD_CLIENT_ID = "";

    static TWITCH_APPLICATION_CLIENT_ID = "";
    static TWITCH_APPLICATION_CLIENT_SECRET = "";

    static TWITCH_SIGNING_SECRET = "";

    public static loadAndCheckVariables(): boolean {
        if (process.env.PORT && process.env.PORT !== "") {
            this.PORT = process.env.PORT as string;
        } else {
            return false;
        }
        if (process.env.SERVER_URL && process.env.SERVER_URL !== "") {
            this.SERVER_URL = process.env.SERVER_URL as string;
        } else {
            return false;
        }
        if (
            process.env.DISCORD_BOT_TOKEN &&
            process.env.DISCORD_BOT_TOKEN !== ""
        ) {
            this.DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string;
        } else {
            return false;
        }
        if (process.env.DISCORD_SERVER && process.env.DISCORD_SERVER !== "") {
            this.DISCORD_SERVER = process.env.DISCORD_SERVER as string;
        } else {
            return false;
        }
        if (
            process.env.DISCORD_CLIENT_ID &&
            process.env.DISCORD_CLIENT_ID !== ""
        ) {
            this.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
        } else {
            return false;
        }
        if (
            process.env.TWITCH_APPLICATION_CLIENT_ID &&
            process.env.TWITCH_APPLICATION_CLIENT_ID !== ""
        ) {
            this.TWITCH_APPLICATION_CLIENT_ID = process.env
                .TWITCH_APPLICATION_CLIENT_ID as string;
        } else {
            return false;
        }
        if (
            process.env.TWITCH_APPLICATION_CLIENT_SECRET &&
            process.env.TWITCH_APPLICATION_CLIENT_SECRET !== ""
        ) {
            this.TWITCH_APPLICATION_CLIENT_SECRET = process.env
                .TWITCH_APPLICATION_CLIENT_SECRET as string;
        } else {
            return false;
        }
        this.TWITCH_SIGNING_SECRET = generateRandomString(40);
        return true;
    }
}
