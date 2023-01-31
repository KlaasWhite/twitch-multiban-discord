import { Request, Response } from "express";
import StreamerData from "../../configClasses/StreamerData";
import TwitchAuthorisation from "../../twitch/TwitchAuthorisation";

const authenticateConfirm = (req: Request, res: Response) => {
    let code = req.query.code as string;
    let scope = req.query.scope;
    let state = req.query.state as string;

    if (code) {
        let twitchState = state.substring(0, 20);
        let discordId = state.substring(20);
        let user = StreamerData.getStreamer(discordId);
        if (user && user.twitchState === twitchState) {
            res.send("Twitch has been authorised, you can close this tab");
            user.auth.twitchCode = code;
            TwitchAuthorisation.finishUserAuthorisation(user);
        } else {
            res.send("Something might have gone wrong");
        }
    } else {
        res.send("Something might have gone wrong");
    }
};

export default authenticateConfirm;
