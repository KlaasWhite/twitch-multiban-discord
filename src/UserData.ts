import fs from "fs";
import { generateRandomString } from "./utils/functions";

export interface User {
    auth: {
        twitchCode: string;
        twitchAccessToken: string;
        twitchRefreshToken: string;
    };
    status: {
        authorised: boolean;
    };
    credentials: {
        discordId: string;
        streamerId: string;
    };
    twitchState: string;
}

export default class UserData {
    static users: Map<string, User>;
    static twitchMapping: Map<string, string>;

    public static loadConfig(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.readFile("./config/userData.json", (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }
                let savedConfig = JSON.parse(data.toString());
                this.users = new Map<string, User>(savedConfig.users);
                this.twitchMapping = new Map<string, string>(
                    savedConfig.twitchMapping
                );
                resolve();
            });
        });
    }

    public static saveConfig() {
        let serialisedConfig = {
            users: Array.from(this.users.entries()),
            twitchMapping: Array.from(this.twitchMapping.entries()),
        };
        fs.writeFileSync(
            "./config/userData.json",
            JSON.stringify(serialisedConfig)
        );
    }

    public static isUserKnownAndAuthorised(discordId: string): boolean {
        if (this.users.has(discordId)) {
            let user = this.users.get(discordId);
            if (user && user.status.authorised) {
                return true;
            }
        }
        return false;
    }

    public static addUser(discordId: string) {
        let state = generateRandomString(20);
        this.users.set(discordId, {
            auth: {
                twitchCode: "",
                twitchAccessToken: "",
                twitchRefreshToken: "",
            },
            status: {
                authorised: false,
            },
            credentials: {
                discordId: discordId,
                streamerId: "",
            },
            twitchState: state,
        });
        this.saveConfig();
    }

    public static getUser(discordId: string): User | undefined {
        return this.users.get(discordId);
    }

    public static getAllUsers(): Map<string, User> {
        return this.users;
    }

    public static addTwitchIdMap(streamerId: string, discordId: string) {
        this.twitchMapping.set(streamerId, discordId);
        this.saveConfig();
    }

    public static getDiscordIdFromStreamerId(streamerId: string) {
        return this.twitchMapping.get(streamerId);
    }
}
