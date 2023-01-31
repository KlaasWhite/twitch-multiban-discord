import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    InteractionReplyOptions,
} from "discord.js";
import StreamerData from "../configClasses/StreamerData";
import TwitchApiRequests from "../twitch/TwitchApiRequests";
import TwitchAuthorisation from "../twitch/TwitchAuthorisation";

export const register = (interaction: ChatInputCommandInteraction) => {
    StreamerData.addStreamer(interaction.user.id);
    const url = TwitchAuthorisation.startUserAuthorisation(interaction.user.id);
    const interactionReplyOption: InteractionReplyOptions = {
        content: url,
        ephemeral: true,
    };
    interaction.reply(interactionReplyOption);
};

export const multiban = async (interaction: ChatInputCommandInteraction) => {
    const toBeBannedUsername = interaction.options.get("user")?.value as string;
    const firstReply: InteractionReplyOptions = {
        content: `Banning user ${toBeBannedUsername}`,
        ephemeral: true,
    };
    await interaction.reply(firstReply);
    try {
        const bannedResultLists =
            await TwitchApiRequests.banUserInAllRegisteredChannels(
                toBeBannedUsername
            );
        let bannedListString = "";
        for (let i = 0; i < bannedResultLists.bannedList.length; i++) {
            bannedListString += `${bannedResultLists.bannedList[i]} \n`;
        }
        let alreadyBannedListString = "";
        for (let i = 0; i < bannedResultLists.alreadyBannedList.length; i++) {
            alreadyBannedListString += `${bannedResultLists.alreadyBannedList[i]} \n`;
        }
        let unAuthorisedListString = "";
        for (let i = 0; i < bannedResultLists.unAuthorisedList.length; i++) {
            unAuthorisedListString += `${bannedResultLists.unAuthorisedList[i]} \n`;
        }
        let notBannedListString = "";
        for (let i = 0; i < bannedResultLists.notBannedList.length; i++) {
            notBannedListString += `${bannedResultLists.notBannedList[i]} \n`;
        }
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`${toBeBannedUsername} has been banned`)
            .setFooter({
                text: "Made by KlaasWhite",
            });

        if (bannedListString.length > 0) {
            embed.addFields({
                name: "User banned here",
                value: bannedListString,
            });
        }
        if (alreadyBannedListString.length > 0) {
            embed.addFields({
                name: "User not banned here because there were already banned",
                value: alreadyBannedListString,
            });
        }
        if (unAuthorisedListString.length > 0) {
            embed.addFields({
                name: "User not banned here because streamer is not authorised",
                value: unAuthorisedListString,
            });
        }
        if (notBannedListString.length > 0) {
            embed.addFields({
                name: "User not banned here because some error",
                value: notBannedListString,
            });
        }

        const interactionEmbedReply: InteractionReplyOptions = {
            embeds: [embed],
        };
        interaction.followUp(interactionEmbedReply);
    } catch (error) {
        console.error(error);
    }
};

export const toggleban = (interaction: ChatInputCommandInteraction) => {
    const streamerDiscordId = interaction.member?.user.id;
    const reply: InteractionReplyOptions = {
        content: "",
        ephemeral: true,
    };
    if (streamerDiscordId) {
        const streamer = StreamerData.getStreamer(streamerDiscordId);
        if (streamer) {
            streamer.status.banEnabled = !streamer.status.banEnabled;
            reply.content = `Banning on your account is currently ${streamer.status.banEnabled}`;
            StreamerData.saveConfig();
        } else {
            reply.content =
                "You seem to not have registered yet, use /register";
        }
    } else {
        reply.content = "Something went wrong, sorry!";
    }
    interaction.reply(reply);
};

export const leave = (interaction: ChatInputCommandInteraction) => {
    const streamerDiscordId = interaction.member?.user.id;
    const reply: InteractionReplyOptions = {
        content: "",
        ephemeral: true,
    };
    if (streamerDiscordId) {
        const success = StreamerData.removeStreamer(streamerDiscordId);
        if (success) {
            reply.content = `Your data has correctly been removed`;
        } else {
            reply.content = "Something might have gone wrong";
        }
    } else {
        reply.content = "Something went wrong, sorry!";
    }
    interaction.reply(reply);
};
