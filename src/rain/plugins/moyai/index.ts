import { findByStoreName } from "@metro";
import { FluxDispatcher, ReactNative } from "@metro/common";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import settings from "./settings";
import { useMoyaiSettings } from "./storage";

const { DCDSoundManager } = ReactNative.NativeModules;
const SelectedChannelStore = findByStoreName("SelectedChannelStore");

const THUD_URL =
  "https://raw.githubusercontent.com/Metastruct/garrysmod-chatsounds/master/sound/chatsounds/autoadd/memes/overused%20thud.ogg";
const SOUND_ID = 6969;
let SOUND_DURATION = -1;

const prepareSound = () =>
    new Promise<any>(resolve =>
        DCDSoundManager.prepare(THUD_URL, "notification", SOUND_ID, (_: any, meta: any) =>
            resolve(meta)
        )
    );
let playingTimeout: number | null = null;
let playing = false;
async function playSound() {
    if (playing) {
        if (playingTimeout != null) clearTimeout(playingTimeout);
        DCDSoundManager.stop(SOUND_ID);
        playing = false;
    }
    playing = true;
    DCDSoundManager.play(SOUND_ID);
    playingTimeout = setTimeout(() => {
        playing = false;
        DCDSoundManager.stop(SOUND_ID);
        playingTimeout = null;
    }, SOUND_DURATION);
}

function onMessage(event: any) {
    if (
        event.message?.content &&
        event.channelId === SelectedChannelStore.getChannelId() &&
        !event.message.state &&
        event.sendMessageOptions === undefined
    ) {
        const content = event.message.content;
        let count = (content.match(/🗿/g) ?? []).length;
        count += (content.match(/<a?:\w+:\d+>/gi)?.filter((e: string) => /moyai/i.test(e)) ?? []).length;
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                setTimeout(playSound, i * 350);
            }
        }
    }
}

function onReaction(event: any) {
    if (
        (useMoyaiSettings.getState().allowReactions ?? true) &&
        event.channelId === SelectedChannelStore.getChannelId() &&
        (event.emoji.name === "🗿" || event.emoji.name.match(/.*?moy?ai.*?/i)) &&
        !event.optimistic
    ) {
        playSound();
    }
}

let soundPrepared = false;

export default definePlugin({
    name: "Moyai",
    description: "Play a sound when 🗿 emoji is sent or when reaction is added.",
    author: [Developers.Cynosphere, Developers.kmmiio99o],
    id: "moyai",
    version: "1.0.0",
    start() {
        if (!soundPrepared) {
            prepareSound().then((meta: Record<string, number>) => {
                soundPrepared = true;
                SOUND_DURATION = meta.duration;
            });
        }
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", onReaction);
    },
    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
        FluxDispatcher.unsubscribe("MESSAGE_REACTION_ADD", onReaction);
    },
    settings: settings,
});
