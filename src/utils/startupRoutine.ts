import fs from "fs";
import Config, { Streamer } from "../configClasses/StreamerData";
import { TwitchCredentials } from "../twitch/TwitchCredentials";

const startupConfig = {
    users: new Map<string, Streamer>(),
    twitchMapping: new Map<string, string>(),
};

const checkForNonExistance = () => {
    if (!fs.existsSync("./config")) {
        fs.mkdirSync("./config");
    }
    if (!fs.existsSync("./config/userData.json")) {
        let serialisedConfig = {
            users: Array.from(startupConfig.users.entries()),
            twitchMapping: Array.from(startupConfig.twitchMapping.entries()),
        };
        fs.writeFileSync(
            "./config/userData.json",
            JSON.stringify(serialisedConfig)
        );
    }
    console.log("Config files have been checked and initialised");
};

const startupRoutine = async (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        checkForNonExistance();
        await TwitchCredentials.initialise();
        await Config.loadConfig();
        resolve();
    });
};

export default startupRoutine;
