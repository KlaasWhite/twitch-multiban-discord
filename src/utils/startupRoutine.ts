import fs from "fs";
import Config, { User } from "../UserData";

const startupConfig = {
    users: new Map<string, User>(),
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
};

const startupRoutine = async () => {
    checkForNonExistance();
    await Config.loadConfig();
};

export default startupRoutine;
