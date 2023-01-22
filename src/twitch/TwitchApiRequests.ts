import axios from "axios";
import UserData, { User } from "../UserData";
import EnvironmentVariables from "../utils/EnvironmentVariables";

export default class TwitchAuthorisationRequests {
    private static banUserInChannel = (user: User, userId: string) => {
        return new Promise((resolve, reject) => {
            let config = {
                headers: {
                    Authorization: `Bearer ${user.auth.twitchAccessToken}`,
                    "Client-Id":
                        EnvironmentVariables.TWITCH_APPLICATION_CLIENT_ID,
                    "Content-Type": "application/json",
                },
            };
            let body = {
                data: {
                    user_id: userId,
                    reason: "Spoiling in hide and seek",
                },
            };
            axios
                .post(
                    `https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${user.credentials.streamerId}&moderator_id=${user.credentials.streamerId}`,
                    JSON.stringify(body),
                    config
                )
                .then((value) => {
                    if (value.status === 200) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    };

    private static checkToken = (user: User): Promise<Boolean> => {
        return new Promise((resolve, reject) => {
            let config = {
                headers: {
                    Authorization: `OAuth ${user.auth.twitchAccessToken}`,
                },
            };
            axios
                .get("https://id.twitch.tv/oauth2/validate", config)
                .then((value) => {
                    if (value.status === 200) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    };

    private static refreshToken = (user: User): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            let config = {
                headers: {
                    "Content-Type": `application/x-www-form-urlencoded'`,
                },
            };
            axios
                .post(
                    "https://api.twitch.tv/oauth2/token",
                    `grant_type=refresh_token&refresh_token=${user.auth.twitchRefreshToken}&client_id=${EnvironmentVariables.TWITCH_APPLICATION_CLIENT_ID}&client_secret=${EnvironmentVariables.TWITCH_APPLICATION_CLIENT_ID}`,
                    config
                )
                .then((value) => {
                    if (value.status === 200) {
                        const data = value.data;
                        user.auth.twitchAccessToken = data.access_token;
                        user.auth.twitchRefreshToken = data.refresh_token;
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    };

    private static getToBeBannedUserId = (
        accessToken: string,
        user: string
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            let config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Client-Id":
                        EnvironmentVariables.TWITCH_APPLICATION_CLIENT_ID,
                },
            };
            axios
                .get(`https://api.twitch.tv/helix/users?login=${user}`, config)
                .then((value) => {
                    if (value.status === 200) {
                        const data = value.data;
                        resolve(data.data[0].id);
                    } else {
                        resolve("");
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    };

    public static banUserInAllRegisteredChannels = async (user: string) => {
        const userMap = UserData.getAllUsers();
        const userArray = Array.from(userMap);
        const accessToken = userArray[0][1].auth.twitchAccessToken;
        const userId = await this.getToBeBannedUserId(accessToken, user);
        userMap.forEach(async (user, discordId) => {
            const validToken = await this.checkToken(user);
            if (!validToken) {
                const refreshed = await this.refreshToken(user);
                if (!refreshed) {
                    return;
                }
            }
            this.banUserInChannel(user, userId);
        });
    };
}
