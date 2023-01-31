# SMOO multi ban application

This application will ban a user from a list of twitch streamers.

## Usage

It uses a discord bot as interface.
Every streamer that wants to be included has to to `/regiser`.
This will provide a personalised url for them to authorise the application to ban users in their channel.
The bot then provides following commands:

-   multiban <username> | Takes a username and bans them in the authorised and enabled channels
-   toggleban | Enables or Disables banning in the twitch channel linked to the users discord account, auth stays persistant
-   leave | Fully removes the data linked to the users discord and twitch account

## Installation

This application has to be ran as node application, package.json should be set up correctly to compile and deploy

## Setup

This bot requires a discord bot token and a twitch developer application.
Setup following environment variables:

-   PORT | Does not need to be set, is most of the time given by the host
-   SERVER_URL | Location of the server, needs to be the same as set up on Twitch

-   DISCORD_BOT_TOKEN
-   DISCORD_SERVER | The server that this bot will be used in
-   DISCORD_CLIENT_ID | The id of the discord application (snowflake of the bot account)

-   TWITCH_APPLICATION_CLIENT_ID
-   TWITCH_APPLICATION_CLIENT_SECRET
