import React from "react";
import { findByProps, findByStoreName } from "@metro";
import { PressableScale, Text as MetroText, IconButton } from "@metro/common/components";
import { ReactNative as RN } from "@metro/common";
import { showToast } from "@api/ui/toasts";
import { findAssetId } from "@api/assets";
import { useSongSpotlightSettings } from "../storage";
import { fetchTrackInfo, publishFavoritesToRegistry } from "../api";
import SongRow from "../components/SongRow";

const { ScrollView } = findByProps("ScrollView");
const {
    TableRowGroup,
    TableRow,
    Stack,
    TextInput,
    Text,
    Button,
} = findByProps(
    "TableRowGroup",
    "TableRow",
    "Stack",
    "TextInput",
    "Text",
    "Button",
);

export default function FavoriteSongsSettingsPage() {
    const settings = useSongSpotlightSettings();
    const [input, setInput] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function handleAdd() {
        setError(null);
        if (!input) return;
        // Parse Last.fm track URL: https://www.last.fm/music/Artist/Track or /music/Artist/_/Track
        const m = input.match(/last\.fm\/music\/([^\/]+)(?:\/_\/|\/)([^\/?#]+)/i);
        if (!m) {
            setError("Invalid Last.fm track URL");
            return;
        }
        const artist = decodeURIComponent(m[1].replace(/\+/g, " ").trim());
        const title = decodeURIComponent(m[2].replace(/\+/g, " ").trim());
        setLoading(true);
        try {
            const info = await fetchTrackInfo(artist, title);
            const newSong = {
                title,
                artist,
                album: info.album || "",
                url: input,
                albumArt: info.art,
            };
            const updated = [...(settings.favoriteSongs || []), newSong];
            settings.updateSettings({ favoriteSongs: updated });
            // Publish to registry if enabled
            try {
                const UserStore = findByStoreName("UserStore");
                const myId = UserStore?.getCurrentUser?.()?.id;
                if (myId && settings.shareUsername) {
                    publishFavoritesToRegistry(myId, updated);
                }
            } catch {}
            setInput("");
            showToast("Added to favorites", findAssetId("CheckIcon"));
        } catch (e) {
            setError("Failed to fetch track info");
        }
        setLoading(false);
    }

    function handleRemove(idx: number) {
        const updated = [...(settings.favoriteSongs || [])];
        updated.splice(idx, 1);
        settings.updateSettings({ favoriteSongs: updated });
        showToast("Removed favorite", findAssetId("CheckIcon"));
        // Publish removal to registry if enabled
        try {
            const UserStore = findByStoreName("UserStore");
            const myId = UserStore?.getCurrentUser?.()?.id;
            if (myId && settings.shareUsername) {
                publishFavoritesToRegistry(myId, updated);
            }
        } catch {}
    }

    function handleMoveUp(idx: number) {
        if (idx <= 0) return;
        const list = [...(settings.favoriteSongs || [])];
        const tmp = list[idx - 1];
        list[idx - 1] = list[idx];
        list[idx] = tmp;
        settings.updateSettings({ favoriteSongs: list });
        showToast("Moved up", findAssetId("CheckIcon"));
        try {
            const UserStore = findByStoreName("UserStore");
            const myId = UserStore?.getCurrentUser?.()?.id;
            if (myId && settings.shareUsername) publishFavoritesToRegistry(myId, list);
        } catch {}
    }

    function handleMoveDown(idx: number) {
        const len = (settings.favoriteSongs || []).length;
        if (idx >= len - 1) return;
        const list = [...(settings.favoriteSongs || [])];
        const tmp = list[idx + 1];
        list[idx + 1] = list[idx];
        list[idx] = tmp;
        settings.updateSettings({ favoriteSongs: list });
        showToast("Moved down", findAssetId("CheckIcon"));
        try {
            const UserStore = findByStoreName("UserStore");
            const myId = UserStore?.getCurrentUser?.()?.id;
            if (myId && settings.shareUsername) publishFavoritesToRegistry(myId, list);
        } catch {}
    }

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
                <TableRowGroup title="Add songs with Last.fm links">
                    <TextInput
                        placeholder="https://www.last.fm/music/Artist/_/Track"
                        value={input}
                        onChange={setInput}
                        isClearable
                        editable={!loading}
                    />
                    <Button
                        text="Add to favorites"
                        size="md"
                        onPress={handleAdd}
                        disabled={loading || !input}
                        style={{ borderRadius: 8 }}
                    />
                    {error && <Text style={{ color: "#FF6B6B" }}>{error}</Text>}
                </TableRowGroup>

                <TableRowGroup title="Favorites">
                    {(settings.favoriteSongs || []).length === 0 ? (
                        <Text style={{ color: "#888", padding: 8 }}>No favorites added.</Text>
                    ) : (
                        (settings.favoriteSongs || []).map((s, idx) => (
                            <React.Fragment key={s.url || `${s.title}-${idx}`}>
                                <SongRow
                                    track={{
                                        name: s.title,
                                        artist: s.artist,
                                        album: s.album,
                                        playCount: 0,
                                        url: s.url,
                                        albumArt: s.albumArt || null,
                                        rank: idx + 1,
                                    }}
                                    style={{ marginBottom: 6 }}
                                    showAlbumArt={true}
                                    showPlayCount={false}
                                    showAlbumName={true}
                                    showRankNumbers={false}
                                    hasThemeColors={true}
                                    trailing={(
                                        <RN.View style={{ flexDirection: "row", gap: 6 }}>
                                            <IconButton
                                                size="sm"
                                                icon={findAssetId("ArrowSmallUpIcon")}
                                                onPress={() => { if (idx > 0) handleMoveUp(idx); }}
                                            />
                                            <IconButton
                                                size="sm"
                                                icon={findAssetId("ArrowSmallDownIcon")}
                                                onPress={() => { if (idx < (settings.favoriteSongs || []).length - 1) handleMoveDown(idx); }}
                                            />
                                            <IconButton
                                                size="sm"
                                                variant="destructive"
                                                icon={findAssetId("TrashIcon")}
                                                onPress={() => handleRemove(idx)}
                                            />
                                        </RN.View>
                                    )}
                                />
                            </React.Fragment>
                        ))
                    )}
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
