import { findByProps, findByStoreName } from "@metro";

import { storage } from "../../storage";

const MessageActions = findByProps("sendMessage", "receiveMessage");
const SpotifyStore = findByStoreName("SpotifyStore");

// Individual command functions
async function spotifyTrackExecute(args: any[], ctx: any) {
    if (!storage.enabledCommands?.spotifyTrack) return null;
    return handleSpotifyCommand(ctx, (track: any) =>
        `https://open.spotify.com/track/${track.id}`
    );
}

async function spotifyAlbumExecute(args: any[], ctx: any) {
    if (!storage.enabledCommands?.spotifyAlbum) return null;
    return handleSpotifyCommand(ctx, (track: any) =>
        `https://open.spotify.com/album/${track.album.id}`
    );
}

async function spotifyArtistsExecute(args: any[], ctx: any) {
    if (!storage.enabledCommands?.spotifyArtists) return null;
    return handleSpotifyCommand(ctx, (track: any) =>
        track.artists.map((artist: any) =>
            `[${artist.name}](${artist.external_urls.spotify})`
        ).join("\n")
    );
}

async function spotifyCoverExecute(args: any[], ctx: any) {
    if (!storage.enabledCommands?.spotifyCover) return null;
    return handleSpotifyCommand(ctx, (track: any) =>
        track.album.image.url
    );
}

// Common handler for all Spotify commands
async function handleSpotifyCommand(ctx: any, contentGenerator: (track: any) => string) {
    try {
        const channelId = ctx.channel.id;
        const track = SpotifyStore?.getTrack?.();

        if (!track) {
            const fixNonce = Date.now().toString();
            MessageActions.sendMessage(
                channelId,
                { content: "You are not listening to any track." },
                void 0,
                { nonce: fixNonce }
            );
            return null;
        }

        const content = contentGenerator(track);
        const fixNonce = Date.now().toString();

        MessageActions.sendMessage(
            channelId,
            { content },
            void 0,
            { nonce: fixNonce }
        );

        return null;
    } catch (error) {
        console.error("[Spotify Command] Error:", error);
        return null;
    }
}

// Export individual command objects
export const spotifyTrackCommand = {
    name: "spotify track",
    displayName: "spotify track",
    description: "Sends your current Spotify track",
    displayDescription: "Sends your current Spotify track",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: spotifyTrackExecute
};

export const spotifyAlbumCommand = {
    name: "spotify album",
    displayName: "spotify album",
    description: "Sends your current track's album",
    displayDescription: "Sends your current track's album",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: spotifyAlbumExecute
};

export const spotifyArtistsCommand = {
    name: "spotify artists",
    displayName: "spotify artists",
    description: "Sends your current track's artists",
    displayDescription: "Sends your current track's artists",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: spotifyArtistsExecute
};

export const spotifyCoverCommand = {
    name: "spotify cover",
    displayName: "spotify cover",
    description: "Sends your current track's cover",
    displayDescription: "Sends your current track's cover",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: spotifyCoverExecute
};
