import axios from "axios";
import StreamerData, { Streamer } from "../configClasses/StreamerData";
import EnvironmentVariables from "../utils/EnvironmentVariables";
import { TwitchCredentials } from "./TwitchCredentials";
import {
    getUserResponseSchema,
    getUserTokenResponseSchema,
} from "./TwitchResponseSchemas";

enum BanResult {
    BANNED,
    NOT_BANNED,
    ALREADY_BANNED,
    NOT_ENABLED,
    NOT_AUTHORISED,
}

export default class TwitchAuthorisationRequests {
    private static banUserInChannel = (
        streamer: Streamer,
        bannedUserId: string
    ): Promise<BanResult> => {
        return new Promise((resolve, reject) => {
            let config = {
                headers: {
                    Authorization: `Bearer ${streamer.auth.twitchAccessToken}`,
                    "Client-Id":
                        EnvironmentVariables.TWITCH_APPLICATION_CLIENT_ID,
                    "Content-Type": "application/json",
                },
                validateStatus: function (status: number) {
                    return status >= 200;
                },
            };
            let body = {
                data: {
                    user_id: bannedUserId,
                    reason: "Bot automation: Spoiling in hide and seek",
                },
            };
            axios
                .post(
                    `https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${streamer.credentials.streamerId}&moderator_id=${streamer.credentials.streamerId}`,
                    JSON.stringify(body),
                    config
                )
                .then((value) => {
                    if (value.status === 200) {
                        resolve(BanResult.BANNED);
                    } else if (
                        value.status === 400 &&
                        value.data.message ===
                            "The user specified in the user_id field is already banned."
                    ) {
                        resolve(BanResult.ALREADY_BANNED);
                    } else {
                        resolve(BanResult.NOT_BANNED);
                    }
                })
                .catch((error) => {
                    console.error("Error banning user: " + error);
                    resolve(BanResult.NOT_BANNED);
                });
        });
    };

    private static checkToken = (streamer: Streamer): Promise<Boolean> => {
        return new Promise((resolve, reject) => {
            let config = {
                headers: {
                    Authorization: `OAuth ${streamer.auth.twitchAccessToken}`,
                },
                validateStatus: function (status: number) {
                    return status >= 200;
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
                    resolve(false);
                });
        });
    };

    private static refreshToken = (streamer: Streamer): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            const urlParams = new URLSearchParams();
            urlParams.append(
                "client_id",
                EnvironmentVariables.TWITCH_APPLICATION_CLIENT_ID
            );
            urlParams.append(
                "client_secret",
                EnvironmentVariables.TWITCH_APPLICATION_CLIENT_SECRET
            );
            urlParams.append("grant_type", "refresh_token");
            urlParams.append("refresh_token", streamer.auth.twitchRefreshToken);
            axios
                .post("https://id.twitch.tv/oauth2/token", urlParams)
                .then((value) => {
                    if (value.status === 200) {
                        const userTokenResponse =
                            getUserTokenResponseSchema.safeParse(value.data);
                        if (userTokenResponse.success) {
                            streamer.auth.twitchAccessToken =
                                userTokenResponse.data.access_token;
                            streamer.auth.twitchRefreshToken =
                                userTokenResponse.data.refresh_token;
                        }
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch((error) => {
                    resolve(false);
                });
        });
    };

    private static getToBeBannedUserId = (
        accessToken: string,
        userName: string
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            let config = {
                headers: {
                    Authorization: `Bearer ${TwitchCredentials.OAuthToken}`,
                    "Client-Id":
                        EnvironmentVariables.TWITCH_APPLICATION_CLIENT_ID,
                },
            };
            axios
                .get(
                    `https://api.twitch.tv/helix/users?login=${userName}`,
                    config
                )
                .then((value) => {
                    if (value.status === 200) {
                        const userData = getUserResponseSchema.safeParse(
                            value.data
                        );
                        if (userData.success) {
                            resolve(userData.data.data[0].id);
                        } else {
                            reject("Error in validation user data");
                        }
                    } else {
                        resolve("Get user data returned non 200 response");
                    }
                })
                .catch((error) => {
                    resolve(error);
                });
        });
    };

    private static async banUserForStreamer(
        streamer: Streamer,
        bannedUserId: string
    ): Promise<BanResult> {
        try {
            if (!streamer.status.authorised || !streamer.status.banEnabled) {
                return BanResult.NOT_ENABLED;
            }
            const validToken = await this.checkToken(streamer);
            if (!validToken) {
                const refreshed = await this.refreshToken(streamer);
                if (!refreshed) {
                    streamer.status.authorised = false;
                    return BanResult.NOT_AUTHORISED;
                }
            }
            const banStatus = await this.banUserInChannel(
                streamer,
                bannedUserId
            );
            return banStatus;
        } catch (e) {
            console.error(
                `Problem with banning person in channel ${streamer.credentials.streamerName}: ` +
                    e
            );
            return BanResult.NOT_BANNED;
        }
    }

    public static banUserInAllRegisteredChannels = (
        bannedUserName: string
    ): Promise<{
        bannedList: string[];
        alreadyBannedList: string[];
        unAuthorisedList: string[];
        notBannedList: string[];
    }> => {
        return new Promise(async (resolve, reject) => {
            const streamerMap = StreamerData.getAllStreamers();
            const streamerArray = Array.from(streamerMap);
            const accessToken = streamerArray[0][1].auth.twitchAccessToken;
            const bannedUserId = await this.getToBeBannedUserId(
                accessToken,
                bannedUserName
            );

            const bannedList: string[] = [];
            const alreadyBannedList: string[] = [];
            const unAuthorisedList: string[] = [];
            const notBannedList: string[] = [];
            for (let i = 0; i < streamerArray.length; i++) {
                const streamer = streamerArray[i][1];
                const banStatus = await this.banUserForStreamer(
                    streamer,
                    bannedUserId
                );
                switch (banStatus) {
                    case BanResult.BANNED:
                        bannedList.push(streamer.credentials.streamerName);
                        break;
                    case BanResult.ALREADY_BANNED:
                        alreadyBannedList.push(
                            streamer.credentials.streamerName
                        );
                        break;
                    case BanResult.NOT_AUTHORISED:
                        unAuthorisedList.push(
                            streamer.credentials.streamerName
                        );
                        break;
                    case BanResult.NOT_BANNED:
                        notBannedList.push(streamer.credentials.streamerName);
                        break;
                }
            }
            StreamerData.saveConfig();
            resolve({
                bannedList,
                alreadyBannedList,
                unAuthorisedList,
                notBannedList,
            });
        });
    };
}
