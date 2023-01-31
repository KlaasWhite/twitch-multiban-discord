import express from "express";
import DiscordHelper from "./discord/DiscordHelper";
import authenticateConfirm from "./requests/authenticate/confirm";
import authenticateRequest from "./requests/authenticate/request";
import EnvironmentVariables from "./utils/EnvironmentVariables";
import startupRoutine from "./utils/startupRoutine";
import verifyTwitchSignature from "./twitch/veriftyTwitchSignature";

require("dotenv").config();

export const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.json({ verify: verifyTwitchSignature }));

let started = EnvironmentVariables.loadAndCheckVariables();

if (!started) {
    console.log(
        "One or more of the environment variables were not valid or empty strings"
    );
    process.exit();
}

app.get("/authenticate/request", (req, res) => {
    try {
        authenticateRequest(req, res);
    } catch (error) {
        console.error("Error in request endpoint: " + error);
    }
});

app.get("/authenticate/confirm", (req, res) => {
    try {
        authenticateConfirm(req, res);
    } catch (error) {
        console.error("Error in confirm endpoint: " + error);
    }
});

const initialise = async () => {
    try {
        console.log("============================================");
        console.log("Initialising app");
        await startupRoutine();
        await DiscordHelper.initialiseDiscord();
        app.listen(PORT, () => {
            console.log("HTTP server listening on port " + PORT);
            console.log("============================================");
        });
    } catch (e) {
        console.log("Error in initialise: " + e);
    }
};

initialise();
