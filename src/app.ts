import express from "express";
import DiscordHelper from "./DiscordHelper";
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
    authenticateRequest(req, res);
});

app.get("/authenticate/confirm", (req, res) => {
    authenticateConfirm(req, res);
});

const initalise = async () => {
    try {
        startupRoutine();
        await DiscordHelper.initialiseDiscord();
    } catch (e) {
        console.log(e);
    }
};

initalise();

app.listen(PORT, () => {
    console.log("listening on port " + PORT);
});
