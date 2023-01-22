import { Request, Response } from "express";
import UserData from "../../UserData";
import EnvironmentVariables from "../../utils/EnvironmentVariables";

const authenticateRequest = (req: Request, res: Response) => {
    let discordId = req.query.discordId;
    if (typeof discordId === "string") {
        let user = UserData.getUser(discordId);
        if (user) {
            res.redirect(
                `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${EnvironmentVariables.TWITCH_APPLICATION_CLIENT_ID}&redirect_uri=${EnvironmentVariables.SERVER_URL}/authenticate/confirm&scope=moderator:manage:banned_users&state=${user.twitchState}${user.credentials.discordId}`
            );
            return;
        }
    }
    res.send("Something went wrong");
};

export default authenticateRequest;
