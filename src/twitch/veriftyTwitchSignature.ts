import * as crypto from "crypto";
import EnvironmentVariables from "../utils/EnvironmentVariables";

const verifyTwitchSignature = (req: any, res: any, buf: any, encoding: any) => {
    const messageId = req.header("Twitch-Eventsub-Message-Id");
    const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
    const messageSignature = req.header("Twitch-Eventsub-Message-Signature");
    const time = Math.floor(new Date().getTime() / 1000);
    // console.log(`Message ${messageId} Signature: `, messageSignature);

    if (Math.abs(time - timestamp) > 600) {
        // needs to be < 10 minutes
        console.log(
            `Verification Failed: timestamp > 10 minutes. Message Id: ${messageId}.`
        );
        throw new Error("Ignore this request.");
    }

    if (!EnvironmentVariables.TWITCH_SIGNING_SECRET) {
        console.log(`Twitch signing secret is empty.`);
        throw new Error("Twitch signing secret is empty.");
    }

    const computedSignature =
        "sha256=" +
        crypto
            .createHmac("sha256", EnvironmentVariables.TWITCH_SIGNING_SECRET)
            .update(messageId + timestamp + buf)
            .digest("hex");
    // console.log(`Message ${messageId} Computed Signature: `, computedSignature);

    if (messageSignature !== computedSignature) {
        throw new Error("Invalid signature.");
    } else {
    }
};

export default verifyTwitchSignature;
