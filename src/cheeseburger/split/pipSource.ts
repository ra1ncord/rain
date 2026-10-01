export const sameId = (a: any, b: any) => a != null && b != null && String(a) === String(b);
export const isStreamParticipant = (p: any) => p?.type === 0 || String(p?.id ?? "").startsWith("call:") || !!p?.stream;
export const isParticipant = (p: any) => !!p && typeof p === "object" && p.id != null && "type" in p && ("user" in p || "streamId" in p);
export const hasPipStreamId = (p: any) => p?.streamId != null && (typeof p.streamId === "number" && Number.isFinite(p.streamId) && p.streamId > 0
    || typeof p.streamId === "string" && p.streamId.trim().length > 0 && p.streamId !== "undefined" && p.streamId !== "null");

export const pipValueLike = (old: any, value: any) => typeof old === "number" && value != null && Number.isFinite(Number(value))
    ? Number(value) : typeof old === "string" && value != null ? String(value) : value;

export function replacePipSource(value: any, want: any, parts: any[]): any {
    if (!value || typeof value !== "object" || !hasPipStreamId(want) || Array.isArray(value) || "$$typeof" in value) return value;
    if (isParticipant(value)) return sameId(value.id, want.id) ? value : want;
    let next = value;
    const put = (key: string, item: any) => {
        if (!(key in value) || value[key] === item) return;
        if (next === value) next = { ...value };
        next[key] = item;
    };
    for (const key of ["participant", "pipParticipant", "videoParticipant", "selectedParticipant", "focusedParticipant"]) {
        if (isParticipant(value[key])) put(key, sameId(value[key].id, want.id) ? value[key] : want);
    }
    const selection = "selectedParticipantStreamId" in value;
    const media = "streamId" in value && (parts.some(p => sameId(p.streamId, value.streamId))
        || "isCamera" in value || "videoSpinnerContext" in value || "participantId" in value);
    if (!selection && !media) return next;
    const uid = want.user?.id ?? want.userId ?? (isStreamParticipant(want) ? want.stream?.ownerId : want.id);
    if (selection) {
        put("selectedParticipantStreamId", pipValueLike(value.selectedParticipantStreamId, want.streamId));
        put("selectedParticipantUserId", uid == null ? null : pipValueLike(value.selectedParticipantUserId, uid));
        put("focusedParticipantType", pipValueLike(value.focusedParticipantType, want.type));
        put("selectedParticipantSpeaking", !!(want.speaking ?? want.voiceState?.speaking));
    }
    if (media) {
        put("streamId", pipValueLike(value.streamId, want.streamId));
        put("participantId", pipValueLike(value.participantId, want.id));
        if (parts.some(p => sameId(p.id, value.id))) put("id", pipValueLike(value.id, want.id));
        if (uid != null) put("userId", pipValueLike(value.userId, uid));
        put("isCamera", !isStreamParticipant(want));
        put("isStream", isStreamParticipant(want));
        if (want.stream?.key != null) put("streamKey", want.stream.key);
    }
    return next;
}
