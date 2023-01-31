import axios, { AxiosRequestConfig } from "axios";
import EnvironmentVariables from "../utils/EnvironmentVariables";
import { z } from "zod";
import { resolveColor } from "discord.js";
import { Job, scheduleJob } from "node-schedule";
import { getClientTokenResponseSchema } from "./TwitchResponseSchemas";

export class TwitchCredentials {
    static OAuthToken: string = "";
    static RefreshingJob: Job;

    private static getClientOAuthToken(): Promise<string> {
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
            urlParams.append("grant_type", "client_credentials");

            axios
                .post(`https://id.twitch.tv/oauth2/token`, urlParams)
                .then((value) => {
                    if (value.status === 200) {
                        const response = getClientTokenResponseSchema.safeParse(
                            value.data
                        );
                        if (response.success) {
                            resolve(response.data.access_token);
                        } else {
                            reject(
                                "Failed to validate response in TwitchCredentials"
                            );
                        }
                    } else {
                        reject(
                            "Getting OAuth token in getClientOAuthToken returned a non 200 response"
                        );
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    private static setupScheduler() {
        this.RefreshingJob = scheduleJob("0 0 12 * * 0", () => {
            this.getClientOAuthToken()
                .then((value) => {
                    this.OAuthToken = value;
                    console.log("Client credentials has been refreshed");
                    return;
                })
                .catch((error) => {
                    console.error(
                        "Error in getting client token job: " + error
                    );
                    this.OAuthToken = "";
                    return;
                });
        });
        console.log("Client credential refreshing job has been scheduled");
    }

    static async initialise(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.getClientOAuthToken()
                .then((value) => {
                    this.OAuthToken = value;
                    this.setupScheduler();
                    console.log("Client credentials have been acquired");
                    resolve(true);
                })
                .catch((error) => {
                    console.error("Error in getting client token: " + error);
                    resolve(false);
                });
        });
    }
}
