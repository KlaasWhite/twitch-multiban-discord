import { z } from "zod";

export const getClientTokenResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
});

export const getUserTokenResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
    scope: z.array(z.string()),
    refresh_token: z.string(),
});

export const getUserResponseSchema = z.object({
    data: z.array(
        z.object({
            broadcaster_type: z.string(),
            created_at: z.string(),
            description: z.string(),
            display_name: z.string(),
            id: z.string(),
            login: z.string(),
            offline_image_url: z.string(),
            profile_image_url: z.string(),
            type: z.string(),
            view_count: z.number(),
        })
    ),
});
