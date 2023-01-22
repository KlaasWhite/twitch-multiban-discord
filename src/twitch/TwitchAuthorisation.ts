import UserData, { User } from "../UserData";
import axios from "axios";

interface TwitchAuthData {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string[];
    token_type: string;
}

export default class TwitchAuthorisation {
    private static getOAuthToken(code: string): Promise<TwitchAuthData> {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams();
            let client_id = process.env.TWITCH_APPLICATION_CLIENT_ID as string;
            let client_secret = process.env
                .TWITCH_APPLICATION_CLIENT_SECRET as string;
            let url = process.env.SERVER_URL as string;
            params.append("client_id", client_id);
            params.append("client_secret", client_secret);
            params.append("code", code);
            params.append("grant_type", "authorization_code");
            params.append("redirect_uri", `${url}/authenticate/confirm`);

            axios
                .post("https://id.twitch.tv/oauth2/token", params)
                .then((value) => {
                    resolve(value.data);
                })
                .catch((error) => console.error(error));
        });
    }

    private static getStreamerId(user: User): Promise<string> {
        return new Promise((resolve, reject) => {
            let client_id = process.env.TWITCH_APPLICATION_CLIENT_ID as string;
            let config = {
                headers: {
                    Authorization: `Bearer ${user.auth.twitchAccessToken}`,
                    "Client-Id": client_id,
                },
            };
            axios
                .get("https://api.twitch.tv/helix/users", config)
                .then((value) => {
                    console.log(value);
                    resolve(value.data.data[0].id);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    }

    public static startUserAuthorisation(discordId: string): string {
        let url = process.env.SERVER_URL;
        if (url) {
            return `${url}/authenticate/request?discordId=${discordId}`;
        }

        return "";
    }

    public static async finishUserAuthorisation(user: User) {
        let data = await this.getOAuthToken(user.auth.twitchCode);
        user.auth.twitchAccessToken = data.access_token;
        user.auth.twitchRefreshToken = data.refresh_token;
        user.credentials.streamerId = await this.getStreamerId(user);
        UserData.addTwitchIdMap(
            user.credentials.streamerId,
            user.credentials.discordId
        );
        user.status.authorised = true;
        UserData.saveConfig();
    }
}
