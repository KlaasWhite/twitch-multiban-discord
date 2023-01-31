import fs from "fs";
import { generateRandomString } from "../utils/functions";

export interface Streamer {
    auth: {
        twitchCode: string;
        twitchAccessToken: string;
        twitchRefreshToken: string;
    };
    status: {
        authorised: boolean;
        banEnabled: boolean;
    };
    credentials: {
        discordId: string;
        streamerId: string;
        streamerName: string;
    };
    twitchState: string;
}

export default class StreamerData {
    static streamers: Map<string, Streamer>;
    static twitchMapping: Map<string, string>;

    public static loadConfig(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.readFile("./config/StreamerData.json", (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }
                let savedConfig = JSON.parse(data.toString());
                this.streamers = new Map<string, Streamer>(savedConfig.users);
                this.twitchMapping = new Map<string, string>(
                    savedConfig.twitchMapping
                );
                console.log("Streamer data was loaded");
                resolve();
            });
        });
    }

    public static saveConfig() {
        let serialisedConfig = {
            users: Array.from(this.streamers.entries()),
            twitchMapping: Array.from(this.twitchMapping.entries()),
        };
        fs.writeFileSync(
            "./config/StreamerData.json",
            JSON.stringify(serialisedConfig)
        );
    }

    public static isStreamerKnownAndAuthorised(discordId: string): boolean {
        if (this.streamers.has(discordId)) {
            let user = this.streamers.get(discordId);
            if (user && user.status.authorised) {
                return true;
            }
        }
        return false;
    }

    public static addStreamer(discordId: string) {
        let state = generateRandomString(20);
        this.streamers.set(discordId, {
            auth: {
                twitchCode: "",
                twitchAccessToken: "",
                twitchRefreshToken: "",
            },
            status: {
                banEnabled: true,
                authorised: false,
            },
            credentials: {
                discordId: discordId,
                streamerId: "",
                streamerName: "",
            },
            twitchState: state,
        });
        this.saveConfig();
    }

    public static getStreamer(discordId: string): Streamer | undefined {
        return this.streamers.get(discordId);
    }

    public static getAllStreamers(): Map<string, Streamer> {
        return this.streamers;
    }

    public static addTwitchMap(streamerId: string, discordId: string) {
        this.twitchMapping.set(streamerId, discordId);
        this.saveConfig();
    }

    public static getDiscordIdFromStreamerId(streamerId: string) {
        return this.twitchMapping.get(streamerId);
    }

    public static removeStreamer(discordId: string): boolean {
        const streamer = this.streamers.get(discordId);
        if (!streamer) {
            return false;
        }

        const streamerId = streamer.credentials.streamerId;
        this.twitchMapping.delete(streamerId);

        const worked = this.streamers.delete(discordId);
        if (worked) {
            this.saveConfig();
        }
        return worked;
    }
}
