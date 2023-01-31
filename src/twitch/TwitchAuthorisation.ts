import StreamerData, { Streamer } from "../configClasses/StreamerData";
import axios from "axios";
import EnvironmentVariables from "../utils/EnvironmentVariables";
import { getUserTokenResponseSchema } from "./TwitchResponseSchemas";

export default class TwitchAuthorisation {
    private static getOAuthToken(code: string): Promise<[string, string]> {
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
                    const response = getUserTokenResponseSchema.safeParse(
                        value.data
                    );
                    if (response.success) {
                        resolve([
                            response.data.access_token,
                            response.data.refresh_token,
                        ]);
                    } else {
                        reject("Failed to validate response in getOAuthToken");
                    }
                    resolve(value.data);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    private static getStreamerCredentials(
        streamer: Streamer
    ): Promise<[string, string]> {
        return new Promise((resolve, reject) => {
            let client_id = process.env.TWITCH_APPLICATION_CLIENT_ID as string;
            let config = {
                headers: {
                    Authorization: `Bearer ${streamer.auth.twitchAccessToken}`,
                    "Client-Id": client_id,
                },
            };
            axios
                .get("https://api.twitch.tv/helix/users", config)
                .then((value) => {
                    const streamerId = value.data.data[0].id as string;
                    const streamerName = value.data.data[0].login as string;
                    resolve([streamerId, streamerName]);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    }

    public static startUserAuthorisation(discordId: string): string {
        let url = EnvironmentVariables.SERVER_URL;
        if (url) {
            return `${url}/authenticate/request?discordId=${discordId}`;
        }

        return "";
    }

    public static async finishUserAuthorisation(streamer: Streamer) {
        try {
            const [access_token, refresh_token] = await this.getOAuthToken(
                streamer.auth.twitchCode
            );
            streamer.auth.twitchAccessToken = access_token;
            streamer.auth.twitchRefreshToken = refresh_token;
            const [streamerId, streamerName] =
                await this.getStreamerCredentials(streamer);
            streamer.credentials.streamerId = streamerId;
            streamer.credentials.streamerName = streamerName;
            StreamerData.addTwitchMap(
                streamer.credentials.streamerId,
                streamer.credentials.discordId
            );
            streamer.status.authorised = true;
            StreamerData.saveConfig();
        } catch (error) {
            console.error("Error in user authorisation: " + error);
        }
    }
}
