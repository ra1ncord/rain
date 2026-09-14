import { findAssetId } from "@api/assets";
import { createPluginStore } from "@api/storage";
import { rawColors, semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByName, findByProps } from "@metro";
import { FluxUtils, useToken } from "@metro/common";
import { ContextMenu, contextMenu, FlashList } from "@metro/common/components";
import { ChannelStore, GuildReadStateStore, GuildStore, PrivateChannelSortStore, ReadStateStore, SelectedChannelStore, SelectedGuildStore, SortedGuildStore, UserGuildSettingsStore, UserStore } from "@metro/common/stores";
import chroma from "chroma-js";
import { chunk, clamp } from "es-toolkit";
import { Fragment, type RefObject, useEffect, useMemo, useReducer, useRef, useState } from "react";
import * as Native from "react-native";

import { reportActionFailure } from "./index";
import type * as t from "./types";

export const { useStore } = createPluginStore<t.ServerDrawerPreferences>("serverdrawer", { dmOrder: [], layout: "grid" });

export const DOCK_PADDING = 40;
export const DOCK_ITEM_GAP = 10;
export const DOCK_REST_OFFSET = 6;

// Preserve the dock's 48px target and five-to-seven slot sizing rule.
export function computeGuildDockSpecs(availableWidth: number) {
    const dockWidth = Math.max(80, Math.min(454, (Number.isFinite(availableWidth) ? Math.max(0, availableWidth) : 0) - 16));
    const scaleFor = (count: number) => (dockWidth - DOCK_ITEM_GAP * (count - 1) - DOCK_PADDING) / (48 * count);

    const itemCount = [6, 7].reduce((best, count) => Math.abs(1 - scaleFor(count)) < Math.abs(1 - scaleFor(best)) ? count : best, 5);
    const itemSize = Math.max(1, Math.round(48 * scaleFor(itemCount)));

    return { dockHeight: itemSize + 32, dockWidth, itemCountNoExtras: itemCount - 2, itemSize };
}

const BORDER_WIDTH = 1;
const ICON_SIZE = 52;
const ITEM_WIDTH = ICON_SIZE + 12;
const ITEM_GAP = 12;
const SIDE_PADDING = 16;
const YOU_BAR_JOIN_DEPTH = 24;
const LONG_PRESS_MS = 500;
const SWIPE_DISTANCE = 12;
const CENTER = { alignItems: "center", justifyContent: "center" } as const;
const ROW = { alignItems: "center", flexDirection: "row" } as const;
const EMPTY_SNAPSHOT: t.ServerDrawerSnapshot = Object.freeze({ nodes: [], directMessages: [] });

const useStyles = createStyles({
    mentionBadge: { ...CENTER, backgroundColor: semanticColors.STATUS_DANGER, borderColor: semanticColors.BACKGROUND_BASE_LOWEST,
        borderRadius: 10, borderWidth: 2, paddingHorizontal: 4, position: "absolute" },
    unreadBadge: { backgroundColor: semanticColors.TEXT_DEFAULT, borderColor: semanticColors.BACKGROUND_BASE_LOWEST, borderRadius: 7,
        borderWidth: 2, position: "absolute" },
    compactSelection: { borderColor: semanticColors.TEXT_MUTED, borderWidth: 3, bottom: -3, left: -3, position: "absolute", right: -3, top: -3 },
    listItem: { alignItems: "center", borderRadius: 12, flexDirection: "row", gap: 14, minHeight: 68, paddingHorizontal: 10, width: "100%" },
    gridItem: { alignItems: "center", minHeight: 82, width: ITEM_WIDTH },
    selectionRing: { ...CENTER, borderWidth: 3, height: 62, width: 62 },
    gridLabel: { fontSize: 11, marginTop: 4, textAlign: "center", width: 68 },
    previewFrame: { alignItems: "center", backgroundColor: semanticColors.BACKGROUND_SECONDARY_ALT,
        borderColor: semanticColors.BORDER_SUBTLE, borderWidth: 1, elevation: 18, shadowColor: rawColors.BLACK,
        shadowOffset: { height: 8, width: 0 }, shadowRadius: 12 },
    listPreview: { borderRadius: 14, flexDirection: "row", gap: 14, height: 68, paddingHorizontal: 10, shadowOpacity: 0.35 },
    gridPreview: { borderRadius: 20, minHeight: 82, paddingTop: 5, shadowOpacity: 0.4, width: ITEM_WIDTH },
    folderInput: { color: semanticColors.TEXT_DEFAULT, fontSize: 20, padding: 4, borderBottomWidth: 1, borderColor: semanticColors.TEXT_BRAND },
    folderTitle: { color: semanticColors.TEXT_DEFAULT, fontSize: 20, fontWeight: "700" },
    dmButton: { ...CENTER, backgroundColor: semanticColors.BACKGROUND_SECONDARY_ALT, borderRadius: 16 },
    dockDivider: { alignSelf: "center", backgroundColor: semanticColors.BORDER_SUBTLE, marginHorizontal: -5.5, width: 1 },
    dockRow: { ...ROW, gap: DOCK_ITEM_GAP, paddingHorizontal: DOCK_PADDING / 2 },
    emptyContainer: { ...CENTER, minHeight: 180, padding: 24 },
    emptyText: { color: semanticColors.TEXT_DEFAULT, fontSize: 17, fontWeight: "600", textAlign: "center" },
    header: { ...ROW, minHeight: 50, paddingHorizontal: 12 },
    viewTabs: { backgroundColor: semanticColors.BACKGROUND_BASE_LOWER, borderRadius: 10, flex: 1, flexDirection: "row", padding: 3 },
    viewTab: { ...CENTER, borderRadius: 8, flex: 1, minHeight: 36, paddingHorizontal: 5 },
    searchRow: { gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
    searchInput: { backgroundColor: semanticColors.BACKGROUND_BASE_LOWER, color: semanticColors.TEXT_DEFAULT, minHeight: 42,
        paddingHorizontal: 12, borderRadius: 8 },
    filterTabs: { backgroundColor: semanticColors.BACKGROUND_BASE_LOWER, borderRadius: 9, flexDirection: "row", padding: 3 },
    filterTab: { ...CENTER, borderRadius: 7, flex: 1, minHeight: 36 },
    handle: { ...CENTER, height: 16, width: "100%" },
    handleBar: { backgroundColor: semanticColors.TEXT_MUTED, borderRadius: 3, height: 5, opacity: 0.5, width: 38 },
    exitTarget: { ...CENTER, width: 56, height: 56, position: "absolute", zIndex: 110, elevation: 65 },
    folderBackdrop: { alignItems: "center", bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0, zIndex: 60 },
    folderPanel: { alignItems: "center", backgroundColor: semanticColors.BACKGROUND_SECONDARY_ALT, borderRadius: 40, elevation: 45, overflow: "hidden" },
    folderPage: { alignContent: "flex-start", ...ROW, flexWrap: "wrap", gap: 8, paddingBottom: 28, paddingHorizontal: 10, paddingTop: 52 },
    folderHeading: { position: "absolute", top: 8, left: 20, right: 20 },
    pageDots: { alignItems: "center", bottom: 8, flexDirection: "row", gap: 5, justifyContent: "center", position: "absolute" },
    pageDot: { borderRadius: 3, height: 7, marginHorizontal: 4, marginVertical: 10, width: 7 },
    dragPreview: { elevation: 60, position: "absolute", top: 0, zIndex: 100 },
    drawerBackdrop: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0, zIndex: 0 },
    drawerPanel: { backgroundColor: semanticColors.BACKGROUND_BASE_LOWEST, borderColor: semanticColors.BORDER_SUBTLE,
        borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: BORDER_WIDTH, borderBottomWidth: 0,
        elevation: 0, overflow: "hidden", position: "absolute", zIndex: 0 },
    compactFace: { position: "absolute", top: 16, left: 0, right: 0, backgroundColor: semanticColors.BACKGROUND_BASE_LOWEST,
        backfaceVisibility: "hidden", zIndex: 2, transformOrigin: "center top" },
    expandedFace: { position: "absolute", left: 0, right: 0, backgroundColor: semanticColors.BACKGROUND_BASE_LOWEST,
        backfaceVisibility: "hidden", zIndex: 1, transformOrigin: "center top" },
});

function getDrawerGeometry(width: number, height: number, layout: t.DrawerLayout) {
    const dockSpecs = computeGuildDockSpecs(width - 16);
    const grid = layout === "grid";
    const contentWidth = dockSpecs.dockWidth - SIDE_PADDING * 2;
    const columns = grid ? Math.max(3, Math.floor((contentWidth + ITEM_GAP) / (ITEM_WIDTH + ITEM_GAP))) : 1;
    const columnStep = grid ? Math.max(ITEM_WIDTH + ITEM_GAP, (contentWidth - ITEM_WIDTH) / (columns - 1)) : ITEM_WIDTH;
    const previewWidth = grid ? ITEM_WIDTH : Math.max(1, dockSpecs.dockWidth - 20);
    const previewTransform = (point: t.DragPoint): NonNullable<Native.ViewStyle["transform"]> => grid
        ? [{ translateX: point.x - previewWidth / 2 }, { translateY: point.y - 48 }, { scale: 1.07 }]
        : [{ translateY: point.y - 41 }, { scale: 1.025 }];

    return { dockSpecs, grid, columns, columnStep, previewWidth, previewTransform,
        // FlashList owns equal-width cells; offset their contents to preserve the drag column step.
        columnOffset: grid ? columnStep - (contentWidth - BORDER_WIDTH * 2) / columns : 0,
        drawerHeight: clamp(height - 32, dockSpecs.dockHeight, 832), panelLeft: Math.max(0, Math.round((width - dockSpecs.dockWidth) / 2)) };
}

function Icon({ name, color, size = 24, label, onPress, buttonSize = 44 }: t.IconProps) {
    const image = <Native.Image source={findAssetId(name)} style={{ width: size, height: size, tintColor: color }} />;

    return label ? <Native.Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress}
        style={{ ...CENTER, height: buttonSize, width: buttonSize }}>{image}</Native.Pressable> : image;
}

function orderedDms(items: readonly t.DirectMessage[], order: unknown): readonly t.DirectMessage[] {
    const remaining = new Map(items.map(item => [item.id, item]));

    return [...(Array.isArray(order) ? order : []), ...remaining.keys()].flatMap(id => {
        const item = remaining.get(id);
        remaining.delete(id);

        return item ? [item] : [];
    });
}

const initials = (name: string) => name.trim().split(/\s+/u).slice(0, 2).map(piece => piece[0]).join("").toUpperCase() || "?";

function filteredItems(items: readonly t.DrawerItem[], filter: "all" | "unread", query: string): readonly t.DrawerItem[] {
    const search = query.trim().toLocaleLowerCase();
    if (!search && filter === "all") return items;

    const matches = (item: t.DrawerGuild | t.DirectMessage) => (!search || item.name.toLocaleLowerCase().includes(search)) && (filter === "all" || item.unread);

    return items.flatMap<t.DrawerItem>(item => {
        if (item.kind !== "folder") return matches(item) ? [item] : [];
        const children = item.children.filter(matches);

        return search ? children : children.length ? [{ ...item, children }] : [];
    });
}

export function createController() {
    const iconUtils = findByProps("getGuildIconURL", "getChannelIconURL");
    const actions = findByProps("moveById", "createGuildFolderLocal", "editGuildFolderLocal");
    const folderSettings = findByProps("saveGuildFolders");
    const channelNavigation = findByProps("transitionToChannel");
    const guildBarNavigation = findByName("transitionGuildsBarToGuildOrOpenSelectedChannel");

    const nativeActions = [actions?.moveById, actions?.createGuildFolderLocal, actions?.editGuildFolderLocal,
        guildBarNavigation, channelNavigation?.transitionToChannel, folderSettings?.saveGuildFolders];
    if (nativeActions.some(action => typeof action !== "function")) throw new Error("ServerDrawer: a native guild, navigation or account sync action is unavailable");

    const persistFolders = async () => {
        try {
            // Local actions update the tree; the native saver queues the account settings update.
            await folderSettings.saveGuildFolders(SortedGuildStore.getGuildFolders().map((entry: t.NativeGuildFolder) => ({ ...entry, guildIds: [...entry.guildIds] })));
        } catch (error) { reportActionFailure("sync folder changes to your account", error); }
    };

    const mutate = (action: () => void) => {
        action();
        persistFolders();
    };

    const folder = (id: string): t.NativeGuildFolder | undefined => SortedGuildStore.getGuildFolderById(Number(id));

    const editFolder = (current: t.NativeGuildFolder, guildIds = current.guildIds, name = current.folderName) =>
        mutate(() => actions.editGuildFolderLocal(current.folderId, guildIds, name));

    const guildExists = (id: string) => !!GuildStore.getGuild(id);

    const badge = (store: t.ReadStore, id: string): t.BadgeState => ({ mentionCount: store.getMentionCount(id), unread: store.hasUnread(id) });

    const guildNode = (id: string, folderId?: string): t.DrawerGuild[] => {
        const guild = GuildStore.getGuild(id);
        if (!guild?.name?.trim()) return [];
        const state = badge(GuildReadStateStore, id);

        return [{ id, kind: "guild", name: guild.name, folderId,
            avatarUri: guild.icon ? iconUtils.getGuildIconURL({ id, icon: guild.icon, size: 128, canAnimate: true }) : undefined,
            ...state, unread: state.unread || state.mentionCount > 0 }];
    };

    return {
        snapshot(): t.ServerDrawerSnapshot {
            const nodes: t.DrawerNode[] = SortedGuildStore.getGuildFolders().flatMap((folder: t.NativeGuildFolder) => {
                const id = folder.folderId == null ? undefined : String(folder.folderId);
                const children = folder.guildIds.flatMap(guild => guildNode(guild, id));
                if (id === undefined) return children;

                return [{ id, kind: "folder", children, name: folder.folderName?.trim() || undefined, color: folder.folderColor,
                    mentionCount: children.reduce((total, guild) => total + guild.mentionCount, 0), unread: children.some(guild => guild.unread) }];
            });

            const directMessages: t.DirectMessage[] = PrivateChannelSortStore.getPrivateChannelIds().flatMap((id: string) => {
                const channel = ChannelStore.getChannel(id);
                if (!channel || (channel.type !== 1 && channel.type !== 3)) return [];

                const users: t.NativeUser[] = (channel.recipients ?? []).map((recipient: string) => UserStore.getUser(recipient)).filter((user: t.NativeUser | undefined) => user !== undefined);
                const avatarUri = channel.type === 1 ? users[0]?.getAvatarURL?.(undefined, 128, true)
                    : channel.icon ? iconUtils.getChannelIconURL({ id, icon: channel.icon, size: 128 }) : undefined;

                return [{ id, avatarUri, ...badge(ReadStateStore, id), name: channel.name || users.map(user => user.globalName || user.username).join(", ") || "Direct Message" }];
            });

            return { nodes, directMessages, selectedGuildId: SelectedGuildStore.getGuildId(), selectedPrivateChannelId: SelectedChannelStore.getChannelId() };
        },

        // Native actions return void; false means the item or route is no longer available.
        selectGuild: (id: string): void | false => guildExists(id) ? guildBarNavigation(id) : false,

        selectPrivateChannel: (id: string): void | false => ChannelStore.getChannel(id) ? channelNavigation.transitionToChannel(id, {}) : false,

        commitDrop(sourceId: string, targetId: string, mode: "move" | "merge" | "exit") {
            const target = folder(targetId);
            // An exit edits full native membership; omitted members become standalone servers.
            if (mode === "exit") return !!target?.guildIds.includes(sourceId) && editFolder(target, target.guildIds.filter(id => id !== sourceId));
            const source = mode === "move" ? folder(sourceId) : undefined;
            if (sourceId === targetId || !source && !guildExists(sourceId) || !target && !guildExists(targetId)) return false;

            if (mode === "move") return mutate(() => actions.moveById(source?.folderId ?? sourceId, target?.folderId ?? targetId));
            return target ? !target.guildIds.includes(sourceId) && editFolder(target, [...target.guildIds, sourceId])
                : mutate(() => actions.createGuildFolderLocal([targetId, sourceId], undefined));
        },

        renameFolder(id: string, name: string) {
            const current = folder(id);

            return !!current && editFolder(current, undefined, name.trim());
        },

        openCreateGuild: (): void => findByProps("openCreateGuildModal").openCreateGuildModal(),

        openCreateDm(): void | false {
            const navigator = findByProps("getRootNavigationRef").getRootNavigationRef()?.current;
            // Use the same nested route as Discord's Messages header, including on first use.
            return navigator ? navigator.navigate("friends", { screen: "new-message", params: { sourcePage: "NEW_MESSAGE_COMPOSER" } }) : false;
        },

        animateNext: (duration?: number) => Native.LayoutAnimation.configureNext({ duration: duration ?? 110, update: { type: Native.LayoutAnimation.Types.easeInEaseOut } }),
    };
}

export function createGuildMenu(signal: AbortSignal) {
    const getItems = findByName("getGuildsBarGuildMenuItems");
    if (typeof getItems !== "function") throw new Error("ServerDrawer: native guild menu is unavailable");

    return function GuildMenu({ guild, children }: t.GuildMenuProps) {
        const items: t.MenuItem[] = FluxUtils.useStateFromStores([GuildStore, UserGuildSettingsStore],
            () => getItems(guild.id).map((item: t.MenuItem) => ({
                ...item,
                async action() {
                    try { await item.action(); }
                    catch (error) { reportActionFailure("complete this server action", error); }
                },
            })), [guild.id]);
        useEffect(() => {
            const close = () => {
                if (contextMenu.ContextMenuStore.getState().menu?.items === items) contextMenu.hideContextMenu();
            };
            signal.addEventListener("abort", close);

            return () => { signal.removeEventListener("abort", close); close(); };
        }, [items]);

        return <ContextMenu items={items} title={guild.name} triggerOnLongPress disableGesture>{children}</ContextMenu>;
    };
}

export function createServerDrawerSurface(controller: ReturnType<typeof createController>, signal: AbortSignal) {
    const GuildMenu = createGuildMenu(signal);
    const { useNavigatorBackPressHandler } = findByProps("useNavigatorBackPressHandler");
    const { Gesture, GestureDetector }: t.NativeGestureModule = findByProps("Gesture", "GestureDetector");
    const { Image, Pressable, ScrollView, Text, View, TextInput } = Native;

    function DragTarget(properties: t.DragTargetProps) {
        const callbacks = useRef(properties);
        callbacks.current = properties;
        const gesture = useMemo(() => Gesture.Pan().activateAfterLongPress(LONG_PRESS_MS)
            .shouldCancelWhenOutside(false).runOnJS(true)
            .onStart(({ absoluteX: x, absoluteY: y }) => callbacks.current.onStart({ x, y }))
            .onUpdate(({ absoluteX: x, absoluteY: y }) => callbacks.current.onMove({ x, y }))
            .onEnd(({ absoluteX: x, absoluteY: y }, success) => { if (success) callbacks.current.onDrop({ x, y }); })
            .onFinalize(() => callbacks.current.onCancel()), []);

        return <GestureDetector gesture={gesture}>
            <View collapsable={false} style={properties.offset ? { transform: [{ translateY: properties.offset }] } : undefined}>{properties.children}</View>
        </GestureDetector>;
    }

    function Artwork({ item, size, badged, compact, selected }: t.ArtworkProps) {
        const styles = useStyles();
        const background: string = useToken(semanticColors.BACKGROUND_BASE_LOWER);
        const foreground: string = useToken(semanticColors.TEXT_DEFAULT);
        const folderBackground: string = useToken(semanticColors.GUILD_FOLDER_BACKGROUND);
        const folder = item.kind === "folder";
        const uri = folder ? undefined : item.avatarUri;
        const radius = !item.kind ? size / 2 : size >= 44 ? 16 : folder ? 9 : Math.max(5, Math.round(size * 0.28));
        let fill = item.kind === "guild" ? rawColors.BRAND_500 : background;
        if (folder) fill = item.color === undefined ? folderBackground : `#${item.color.toString(16).padStart(6, "0")}`;

        return <View style={{ ...CENTER, position: "relative", height: size, width: size, borderRadius: radius, backgroundColor: uri ? undefined : fill }}>
            {folder ? item.children.slice(0, 4).map((guild, index) => <View key={guild.id} style={{ [index % 2 ? "right" : "left"]: 6, [index < 2 ? "top" : "bottom"]: 6, position: "absolute" }}>
                <Artwork item={guild} size={Math.floor(size * 0.34)} />
            </View>) : uri ? <Image accessibilityIgnoresInvertColors resizeMode="cover" source={{ uri }}
                style={{ borderRadius: radius, height: size, width: size }} /> :
                <Text numberOfLines={1} style={{ color: item.kind ? rawColors.WHITE : foreground,
                    fontSize: Math.max(10, Math.round(size * 0.34)), fontWeight: "700" }}>{initials(item.name)}</Text>}
            {selected ? <View pointerEvents="none" style={[styles.compactSelection, { borderRadius: size / 3 + 3 }]} /> : null}
            {badged && (item.mentionCount ? <View style={[styles.mentionBadge,
                { bottom: compact ? -3 : -4, minHeight: compact ? 18 : 20, minWidth: compact ? 18 : 20, right: compact ? -4 : -5 }]}>
                <Text style={{ color: rawColors.WHITE, fontSize: compact ? 9 : 10, fontWeight: "800" }}>{item.mentionCount > 99 ? "99+" : item.mentionCount}</Text>
            </View> : item.unread ? <View style={[styles.unreadBadge,
                { bottom: compact ? -2 : -3, height: compact ? 13 : 14, right: compact ? -2 : -3, width: compact ? 13 : 14 }]} /> : null)}
        </View>;
    }

    function Item({ item, layout = "grid", selectedId, dragging, merging, onPress, menu, compactSize, previewWidth }: t.ItemProps) {
        const styles = useStyles();
        const foreground: string = useToken(semanticColors.TEXT_DEFAULT);
        const brand: string = useToken(semanticColors.TEXT_BRAND);
        const muted: string = useToken(semanticColors.TEXT_MUTED);
        const folder = item.kind === "folder";
        const selected = !folder && item.id === selectedId;
        const label = item.name ?? (compactSize ? "Server folder" : "Folder");
        const accessibilityLabel = label + (item.mentionCount > 0 ? `, ${item.mentionCount} mentions` : item.unread ? ", unread" : "");
        const artwork = <Artwork item={item} size={compactSize ?? ICON_SIZE} badged compact={!!compactSize} selected={!!compactSize && selected} />;

        if (compactSize) return <Pressable {...menu} accessibilityRole="button" onPress={onPress}
            accessibilityLabel={folder ? label : accessibilityLabel} accessibilityState={folder ? undefined : { selected }}
            accessibilityHint={folder ? undefined : "Long press for server actions"} delayLongPress={folder ? undefined : LONG_PRESS_MS}
            style={{ height: compactSize, width: compactSize }}>{artwork}</Pressable>;

        const list = layout === "list";
        const highlighted = selected || merging;
        const content = <>
            {list || previewWidth ? artwork : <View style={[styles.selectionRing,
                { borderColor: highlighted ? brand : "transparent", borderRadius: item.kind ? 20 : 31 }]}>{artwork}</View>}
            <Text ellipsizeMode={list ? undefined : "tail"} numberOfLines={1} style={[list ? { flex: 1, fontSize: 16 } : styles.gridLabel,
                { color: selected ? brand : foreground, fontWeight: selected || previewWidth ? "700" : "500" },
                previewWidth && !list ? { width: 60 } : undefined]}>{label}</Text>
            {!previewWidth && list && folder ? <Icon name="ChevronSmallRightIcon" color={muted} size={22} /> : null}
        </>;

        if (previewWidth) return <View style={[styles.previewFrame, list ? [styles.listPreview, { width: previewWidth }] : styles.gridPreview]}>{content}</View>;

        return <Pressable ref={menu?.ref} accessibilityActions={menu?.accessibilityActions} onAccessibilityAction={menu?.onAccessibilityAction}
            accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ selected }}
            cancelable={!dragging} delayLongPress={LONG_PRESS_MS} onPress={onPress}
            pressRetentionOffset={{ bottom: 4096, left: 4096, right: 4096, top: 4096 }}
            style={[list ? styles.listItem : styles.gridItem, { opacity: dragging ? 0.08 : 1 },
                list ? { backgroundColor: highlighted ? `${brand}24` : "transparent" } : undefined]}>{content}</Pressable>;
    }

    function FolderTitle({ folder, style }: t.FolderTitleProps) {
        const styles = useStyles();
        const TEXT_DEFAULT: string = useToken(semanticColors.TEXT_DEFAULT);
        const [editing, setEditing] = useState<"idle" | "editing" | "error">("idle");

        if (editing !== "idle") return <View style={style}>
            <TextInput accessibilityLabel="Folder name" autoFocus selectTextOnFocus maxLength={100} defaultValue={folder.name ?? ""} returnKeyType="done" style={styles.folderInput}
                onEndEditing={({ nativeEvent: { text } }) => {
                    try {
                        if (text.trim() !== (folder.name ?? "") && controller.renameFolder(folder.id, text) === false) throw new Error("Folder is no longer available");
                        setEditing("idle");
                    } catch { setEditing("error"); }
                }} />
            {editing === "error" ? <Text style={{ color: TEXT_DEFAULT, fontSize: 12 }}>Could not rename folder. Try again.</Text> : null}
        </View>;

        return <Pressable accessibilityRole="button" accessibilityLabel={`Rename folder: ${folder.name ?? "Folder"}`} onPress={() => setEditing("editing")} style={style}>
            <Text numberOfLines={1} style={styles.folderTitle}>{folder.name || "Folder"}</Text>
        </Pressable>;
    }

    function Tabs<Value extends string>({ options, value, onChange, filter = false }: t.TabsProps<Value>) {
        const styles = useStyles();
        const background: string = useToken(semanticColors.BACKGROUND_SECONDARY_ALT);
        const foreground: string = useToken(semanticColors.TEXT_DEFAULT);
        const muted: string = useToken(semanticColors.TEXT_MUTED);

        return <View accessibilityRole="tablist" style={filter ? styles.filterTabs : styles.viewTabs}>
            {options.map(([id, label, accessibilityLabel = label]) => <Pressable key={id} accessibilityLabel={accessibilityLabel} accessibilityRole="tab" accessibilityState={{ selected: value === id }}
                onPress={() => onChange(id)} style={[filter ? styles.filterTab : styles.viewTab,
                    { backgroundColor: value === id ? background : "transparent" }]}>
                <Text numberOfLines={filter ? undefined : 1} style={{ color: value === id ? foreground : muted,
                    fontSize: filter ? 14 : 13, fontWeight: value === id ? "700" : "500" }}>{label}</Text>
            </Pressable>)}
        </View>;
    }

    function useDrawerData() {
        const stored = useStore();
        const layout: t.DrawerLayout = stored.layout === "list" ? "list" : "grid";

        const snapshot: t.ServerDrawerSnapshot = FluxUtils.useStateFromStores(
            [ChannelStore, GuildReadStateStore, GuildStore, PrivateChannelSortStore, ReadStateStore, SelectedChannelStore, SelectedGuildStore, SortedGuildStore, UserStore],
            () => signal.aborted ? EMPTY_SNAPSHOT : controller.snapshot(),
        );

        const directMessages = useMemo(() => orderedDms(snapshot.directMessages, stored.dmOrder),
            [snapshot.directMessages, stored.dmOrder]);

        return { ...snapshot, layout, directMessages };
    }

    function useReorder(directMessages: readonly t.DirectMessage[], previewTransform: (point: t.DragPoint) => Native.ViewStyle["transform"]) {
        const [, refresh] = useReducer(value => value + 1, 0);
        const reorder = useRef<t.ReorderState | undefined>(undefined);
        const previewRef = useRef<Native.View | null>(null);
        const exitTarget = useRef<Native.View | null>(null);
        const exitBounds = useRef<Native.LayoutRectangle | undefined>(undefined);

        const measureExit = () => {
            const target = exitTarget.current;
            exitBounds.current = undefined;
            target?.measureInWindow((x, y, width, height) => {
                if (exitTarget.current === target) exitBounds.current = { x, y, width, height };
            });
        };

        const begin = (source: t.DrawerItem, point: t.DragPoint, items: readonly t.DrawerItem[], geometry: t.ReorderGeometry, openMenu?: () => void) => {
            const from = items.indexOf(source);
            if (from < 0) return;
            measureExit();
            reorder.current = { ...geometry, source, items, from, target: from, start: point, point, openMenu };
            controller.animateNext(90);
            refresh();
        };

        const move = ({ x, y }: t.DragPoint) => {
            const active = reorder.current;
            if (!active) return;

            const { source, from, columns, columnStep, rowStep, target: previousTarget, mergeSince, outside } = active;
            const dx = x - active.start.x, dy = y - active.start.y;
            const grid = active.layout === "grid";

            active.point = { x, y };
            active.moved ||= Math.hypot(dx, dy) > 10;
            previewRef.current?.setNativeProps({ style: { transform: previewTransform(active.point) } });

            active.outside = source.kind === "guild" && !!source.folderId && !!exitTarget.current && hitsDropTarget(active.point, exitBounds.current);
            active.target = active.outside ? from : clamp(from + Math.round(dy / rowStep) * columns + (grid ? Math.round(dx / columnStep) : 0), 0, active.items.length - 1);

            const target = active.items[active.target];
            const row = Math.floor(active.target / columns) - Math.floor(from / columns);
            const column = active.target % columns - from % columns;
            const centered = Math.abs(dy - row * rowStep) < (grid ? 22 : 20)
                && (!grid || Math.abs(dx - column * columnStep) < 22);
            const merge = source.kind === "guild" && target.kind && from !== active.target && centered
                && (target.kind === "folder" ? source.folderId !== target.id : !source.folderId || source.folderId !== target.folderId);
            active.mergeSince = merge ? previousTarget === active.target ? mergeSince ?? Date.now() : Date.now() : undefined;

            if (outside !== active.outside || !!mergeSince !== !!active.mergeSince || previousTarget !== active.target) refresh();
            if (previousTarget !== active.target && !active.outside) controller.animateNext(90);
        };

        const cancel = () => {
            if (!reorder.current) return;
            reorder.current = undefined;
            controller.animateNext(110);
            refresh();
        };

        const finish = (showMenu = false) => {
            const active = reorder.current;
            if (!active) return;
            cancel();

            const { source, items, target, from, outside, moved, mergeSince, layout } = active;
            if (showMenu && !moved) return active.openMenu?.();

            try {
                if (!source.kind) {
                    const dmOrder = directMessages.map(item => item.id);
                    const sourceIndex = dmOrder.indexOf(source.id), targetIndex = dmOrder.indexOf(items[target].id);
                    if (from === target || sourceIndex < 0 || targetIndex < 0) return;
                    dmOrder.splice(targetIndex, 0, ...dmOrder.splice(sourceIndex, 1));
                    useStore.getState().updateSettings({ dmOrder });
                } else {
                    const merge = mergeSince !== undefined && (layout === "grid" || Date.now() - mergeSince >= 450);
                    const exit = outside && source.kind === "guild" && source.folderId;
                    if (!exit && from === target) return;
                    if (controller.commitDrop(source.id, exit || items[target].id, exit ? "exit" : merge ? "merge" : "move") === false)
                        throw new Error("Drop target is no longer available");
                }
            } catch (error) { reportActionFailure("move this item", error); }
        };

        const offset = (id: string) => {
            const active = reorder.current;
            // Keep grid targets under the finger; only list rows shift.
            if (!active || active.layout === "grid" || active.mergeSince !== undefined) return;
            const { from, target, rowStep } = active;
            const index = active.items.findIndex(item => item.id === id);
            if (index < 0) return;

            return from < target ? index > from && index <= target ? -rowStep : undefined
                : index >= target && index < from ? rowStep : undefined;
        };

        return { reorder, previewRef, exitTarget, measureExit, begin, finish, offset,
            handlers: { onMove: move, onCancel: cancel, onDrop: (point: t.DragPoint) => { move(point); finish(true); } } };
    }

    function useDrawerMotion(expanded: boolean, minimum: number, maximum: number, scroll: RefObject<number>,
        reorder: RefObject<t.ReorderState | undefined>, onOpen: (open: boolean) => void) {
        const [height, setHeight] = useState<number>();
        const origin = useRef({ height: 0, y: 0, lastMove: 0, rejected: false });
        const cancel = () => setHeight(undefined);
        const move = (event: Native.GestureResponderEvent) => {
            origin.current.lastMove = Date.now();
            setHeight(clamp(origin.current.height - event.nativeEvent.pageY + origin.current.y, minimum, maximum));
        };
        const callbacks = useRef<Native.PanResponderCallbacks>({}).current;
        // PanResponder reads this same config object for every event.
        Object.assign(callbacks, {
            onStartShouldSetPanResponderCapture: () => { origin.current.rejected = false; return false; },
            onMoveShouldSetPanResponderCapture: (event, { dx, dy }) => {
                if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)
                    || Math.abs(dy) > SWIPE_DISTANCE && (expanded ? dy < 0 || scroll.current > 0 : dy > 0)) origin.current.rejected = true;
                if (origin.current.rejected || reorder.current || Math.abs(dy) <= SWIPE_DISTANCE) return false;
                origin.current.height = expanded ? maximum : minimum;
                origin.current.y = event.nativeEvent.pageY - dy;

                return true;
            },
            onPanResponderGrant: move,
            onPanResponderMove: move,
            onPanResponderRelease: (event, { vy }) => {
                const distance = event.nativeEvent.pageY - origin.current.y;
                const velocity = Date.now() - origin.current.lastMove <= 120 ? vy * 1000 : 0;
                const commit = Math.abs(distance) >= 24
                    || Math.abs(distance) >= SWIPE_DISTANCE && Math.sign(distance) * velocity >= 200;
                onOpen(commit ? distance < 0 : expanded);
            },
            onPanResponderTerminate: cancel,
        } satisfies Native.PanResponderCallbacks);
        const [pan] = useState(() => Native.PanResponder.create(callbacks));

        const currentHeight = height ?? (expanded ? maximum : minimum);
        const reveal = clamp((currentHeight - minimum) / 120, 0, 1);
        const [rollProgress, setRollProgress] = useState(reveal);

        useEffect(() => {
            if (height !== undefined) return setRollProgress(reveal);
            const value = new Native.Animated.Value(rollProgress);
            value.addListener(({ value }) => setRollProgress(value));
            const animation = Native.Animated.timing(value, { toValue: reveal, duration: 180,
                easing: Native.Easing.out(Native.Easing.cubic), useNativeDriver: false });
            animation.start();

            return () => { animation.stop(); value.removeAllListeners(); };
        }, [reveal]);

        const roll = height !== undefined ? reveal : rollProgress;
        const compactFaceHeight = minimum + DOCK_REST_OFFSET - 16;
        const rollAngle = roll * Math.PI / 2;
        const rollSeam = compactFaceHeight * Math.cos(rollAngle) / (1 + compactFaceHeight * Math.sin(rollAngle) / 900);

        return { height: currentHeight, visible: expanded || reveal > 0.5, cancel, handlers: pan.panHandlers,
            compactStyle: { height: compactFaceHeight, opacity: roll < 1 ? 1 : 0, transform: [{ perspective: 900 }, { rotateX: `${-90 * roll}deg` }] } satisfies Native.ViewStyle,
            expandedStyle: { top: 16 + rollSeam, height: roll < 1 ? compactFaceHeight : maximum - 16, opacity: roll > 0 ? 1 : 0, transform: [{ perspective: 900 }, { rotateX: `${90 * (1 - roll)}deg` }] } satisfies Native.ViewStyle };
    }

    function FolderOverlay({ folder, width, height, closeFolder, renderItem, handlers }: t.FolderOverlayProps) {
        const styles = useStyles();
        const TEXT_DEFAULT: string = useToken(semanticColors.TEXT_DEFAULT);
        const TEXT_MUTED: string = useToken(semanticColors.TEXT_MUTED);
        const [folderPage, setFolderPage] = useState(0);
        const folderPager = useRef<Native.ScrollView | null>(null);

        const folderHeight = clamp(height - 64, 240, 360);
        const pages = chunk(folder.children, 3 * Math.max(1, Math.floor((folderHeight - 78) / 90)));
        const folderSize = clamp(width - 32, 240, 320);

        return <Pressable accessibilityLabel="Close server folder" accessibilityRole="button" onAccessibilityEscape={closeFolder}
            onPress={closeFolder} {...handlers} style={[styles.folderBackdrop, { backgroundColor: chroma(rawColors.BLACK).alpha(0.82).css() }]}>
            <Pressable accessibilityLabel={folder.name ?? "Unnamed folder"} accessibilityRole="summary"
                onPress={event => event.stopPropagation()} style={[styles.folderPanel, { height: folderHeight, width: folderSize }]}>
                <ScrollView horizontal pagingEnabled ref={folderPager} showsHorizontalScrollIndicator={false} style={{ height: folderHeight, width: folderSize }}
                    onMomentumScrollEnd={(event: Native.NativeSyntheticEvent<Native.NativeScrollEvent>) =>
                        setFolderPage(clamp(Math.round(event.nativeEvent.contentOffset.x / folderSize), 0, Math.max(0, pages.length - 1)))}>
                    {pages.map((page, pageIndex) => <View key={`folder-page-${pageIndex}`} style={[styles.folderPage, { height: folderHeight, width: folderSize }]}>{page.map(renderItem)}</View>)}
                </ScrollView>
                <FolderTitle key={folder.id} folder={folder} style={styles.folderHeading} />
                {pages.length > 1 ? <View pointerEvents="box-none" style={styles.pageDots}>
                    {pages.map((_page, index) => <Pressable key={`folder-dot-${index}`} accessibilityRole="button"
                        accessibilityLabel={`Folder page ${index + 1}`} accessibilityState={{ selected: index === folderPage }}
                        onPress={() => {
                            setFolderPage(index);
                            folderPager.current?.scrollTo({ animated: true, x: index * folderSize, y: 0 });
                        }} style={[styles.pageDot, { backgroundColor: index === folderPage ? TEXT_DEFAULT : TEXT_MUTED }]} />)}
                </View> : null}
            </Pressable>
        </Pressable>;
    }

    return function ServerDrawerSurface({ bottomInset, onWidthChange }: t.ServerDrawerSurfaceProps) {
        const styles = useStyles();
        const TEXT_MUTED: string = useToken(semanticColors.TEXT_MUTED);
        const TEXT_DEFAULT: string = useToken(semanticColors.TEXT_DEFAULT);
        const TEXT_BRAND: string = useToken(semanticColors.TEXT_BRAND);
        const [ui, setUiState] = useState<t.DrawerState>({ expanded: false, view: "servers", filter: "all", query: "" });
        const setUi = (next: Partial<t.DrawerState>) => setUiState(previous => ({ ...previous, ...next }));
        const { expanded, view, filter, query, folderId, folderOverlayId } = ui;
        const closeFolder = () => setUi({ folderOverlayId: undefined });

        const [{ height: viewportHeight, width: viewportWidth }, setViewport] = useState<Pick<Native.LayoutRectangle, "width" | "height">>(() => Native.Dimensions.get("window"));

        const scrollY = useRef(0);
        const data = useDrawerData();
        const { dockSpecs, drawerHeight, panelLeft, grid, columns, columnStep, previewWidth, previewTransform, columnOffset } =
            getDrawerGeometry(viewportWidth, viewportHeight - bottomInset, data.layout);

        const drawerFolder = data.nodes.find((node): node is t.DrawerFolder => node.kind === "folder" && node.id === folderId);
        const overlayFolder = data.nodes.find((node): node is t.DrawerFolder => node.kind === "folder" && node.id === folderOverlayId);
        const visible = filteredItems(view === "servers" ? drawerFolder?.children ?? data.nodes : data.directMessages, filter, query);
        const drag = useReorder(data.directMessages, previewTransform);
        const active = drag.reorder.current;
        const resize = useDrawerMotion(expanded, dockSpecs.dockHeight - DOCK_REST_OFFSET, drawerHeight, scrollY, drag.reorder, setDrawerOpen);

        useEffect(() => {
            if (folderId && !drawerFolder) setUi({ folderId: undefined });
            if (folderOverlayId && !overlayFolder) setUi({ folderOverlayId: undefined });
        }, [drawerFolder, folderId, folderOverlayId, overlayFolder]);

        useEffect(() => { scrollY.current = 0; }, [filter, folderId, data.layout, query]);

        // Discord owns focus, current-callback tracking and subscription cleanup.
        useNavigatorBackPressHandler(() => {
            if (signal.aborted || !expanded && !folderId && !folderOverlayId) return false;
            if (folderOverlayId) closeFolder();
            else if (folderId) setUi({ folderId: undefined });
            else setDrawerOpen(false, false);

            return true;
        });

        function setDrawerOpen(open: boolean, reset = true) {
            controller.animateNext();
            resize.cancel();
            setUi({ expanded: open, ...(!open && reset ? { folderId: undefined, query: "" } : {}) });
            if (!open && reset) scrollY.current = 0;
        }

        const open = (operation: string, action: () => void | boolean, close = true) => {
            try { if (action() !== false && close) setDrawerOpen(false); }
            catch (error) { reportActionFailure(operation, error); }
        };

        const selectItem = (item: t.DrawerGuild | t.DirectMessage) => {
            if (item.kind) closeFolder();
            open("open this item", () => item.kind ? controller.selectGuild(item.id) : controller.selectPrivateChannel(item.id), resize.visible);
        };

        const changeView = (next: t.DrawerView, open = false): void => {
            if (view === next && !open) return;
            drag.finish();
            setUi({ folderId: undefined, folderOverlayId: undefined, query: "", view: next, ...(open ? { filter: "all" } : {}) });
            if (open) setDrawerOpen(true);
        };

        const renderItem = (item: t.DrawerItem, inFolder = false, compactSize?: number) => {
            const render = (menu?: t.NativeMenuAnchor) => {
                const content = <Item item={item} menu={menu} compactSize={compactSize} layout={inFolder ? "grid" : data.layout}
                    dragging={active?.source.id === item.id}
                    merging={!inFolder && active?.mergeSince !== undefined && active.items[active.target].id === item.id}
                    selectedId={item.kind ? data.selectedGuildId : data.selectedPrivateChannelId}
                    onPress={() => item.kind === "folder" ? setUi(compactSize ? { folderOverlayId: item.id } : { folderId: item.id }) : selectItem(item)} />;

                return compactSize ? content : <DragTarget offset={drag.offset(item.id)} {...drag.handlers}
                    onStart={point => drag.begin(item, point, inFolder ? overlayFolder!.children : visible,
                        { columns: inFolder ? 3 : columns, columnStep: inFolder ? ITEM_WIDTH + 8 : columnStep,
                            layout: inFolder ? "grid" : data.layout, rowStep: inFolder ? 90 : grid ? 82 + ITEM_GAP : 72 }, menu?.onLongPress)}>{content}</DragTarget>;
            };

            return item.kind === "guild" ? <GuildMenu key={item.id} guild={item}>{render}</GuildMenu> : <Fragment key={item.id}>{render()}</Fragment>;
        };

        const viewLabel = view === "servers" ? "servers" : "direct messages";

        return signal.aborted ? null : <View onLayout={({ nativeEvent: { layout } }: Native.LayoutChangeEvent) => {
            if (layout.width > 0 && layout.height > 0) setViewport(layout);
            if (layout.width > 0) onWidthChange(layout.width);
        }} pointerEvents="box-none" style={styles.drawerBackdrop}>
            {overlayFolder && <FolderOverlay key={overlayFolder.id} folder={overlayFolder} width={viewportWidth} height={viewportHeight - bottomInset}
                closeFolder={closeFolder} renderItem={guild => renderItem(guild, true)} handlers={resize.handlers} />}
            <View accessibilityLabel={resize.visible ? view === "servers" ? "All servers drawer" : "Direct messages drawer" : "Server dock"}
                accessibilityViewIsModal={resize.visible} importantForAccessibility={resize.visible ? "yes" : "auto"} {...resize.handlers}
                style={[styles.drawerPanel, { bottom: bottomInset - YOU_BAR_JOIN_DEPTH, height: resize.height + YOU_BAR_JOIN_DEPTH, left: panelLeft, width: dockSpecs.dockWidth }]}>
                <View style={{ height: resize.height, overflow: "hidden" }}>
                    <Pressable accessibilityRole="button" accessibilityState={{ expanded: resize.visible }}
                        accessibilityActions={[{ label: resize.visible ? "Collapse" : "Expand", name: "activate" }]} accessibilityLabel={resize.visible ? "Collapse server drawer" : "Expand server drawer"}
                        hitSlop={{ bottom: 14, left: 14, right: 14, top: 14 }}
                        onAccessibilityAction={() => setDrawerOpen(!resize.visible)} onPress={() => setDrawerOpen(!resize.visible)} style={styles.handle}>
                        <View style={styles.handleBar} />
                    </Pressable>
                    <View pointerEvents={expanded ? "none" : "auto"}
                        accessibilityElementsHidden={resize.visible} importantForAccessibility={resize.visible ? "no-hide-descendants" : "auto"} style={[styles.compactFace, resize.compactStyle]}>
                        <View style={[styles.dockRow, { height: dockSpecs.itemSize }]}>
                            {Array.from({ length: dockSpecs.itemCountNoExtras }, (_, index) => {
                                const node = data.nodes[index];
                                if (!node || node.kind === "folder" && !node.children.length) return <View key={`spacer-${index}`}
                                    accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: dockSpecs.itemSize, opacity: 0, width: dockSpecs.itemSize }} />;

                                return renderItem(node, false, dockSpecs.itemSize);
                            })}
                            <View style={[styles.dockDivider, { height: Math.round(dockSpecs.itemSize * 0.7) }]} />
                            <Pressable accessibilityRole="button" accessibilityLabel="Direct Messages" onPress={() => changeView("dms", true)}
                                style={[styles.dmButton, { height: dockSpecs.itemSize, width: dockSpecs.itemSize }]}>
                                <Icon name="ChatIcon" color={TEXT_DEFAULT} />
                            </Pressable>
                            <Icon label="View all servers" onPress={() => setDrawerOpen(true)} name="GridSquareIcon" color={TEXT_DEFAULT}
                                buttonSize={dockSpecs.itemSize} size={Math.max(10, Math.floor((dockSpecs.itemSize * 0.8 - 5) / 2)) * 2 + 5} />
                        </View>
                    </View>
                    <View pointerEvents={expanded ? "auto" : "none"}
                        accessibilityElementsHidden={!resize.visible} importantForAccessibility={resize.visible ? "auto" : "no-hide-descendants"} style={[styles.expandedFace, resize.expandedStyle]}>
                        <View style={{ height: drawerHeight - 16 }}>
                            <View style={styles.header}>
                                {drawerFolder ? <Fragment>
                                    <Icon label="Back to all servers" onPress={() => setUi({ folderId: undefined })} name="ArrowSmallLeftIcon" color={TEXT_DEFAULT} size={30} />
                                    <FolderTitle key={drawerFolder.id} folder={drawerFolder} style={{ flex: 1, paddingVertical: 8 }} />
                                </Fragment> : <Tabs options={[["servers", "Servers"], ["dms", "Direct Messages"]]} value={view} onChange={changeView} />}
                                <Icon label={`Switch to ${grid ? "list" : "grid"} view`} onPress={() => useStore.getState().updateSettings({ layout: grid ? "list" : "grid" })}
                                    name={grid ? "ListViewIcon" : "GridSquareIcon"} color={TEXT_MUTED} />
                                <Icon label={view === "servers" ? "Create a server" : "Start a direct message"}
                                    onPress={() => open("open creation", view === "servers" ? controller.openCreateGuild : controller.openCreateDm)} name="PlusLargeIcon" color={TEXT_MUTED} />
                            </View>
                            <View style={styles.searchRow}>
                                <TextInput accessibilityLabel={`Search ${viewLabel}`} placeholder={`Search ${viewLabel}`} placeholderTextColor={TEXT_MUTED}
                                    value={query} onChangeText={value => setUi({ query: value })} returnKeyType="search" style={styles.searchInput} />
                                <Tabs<"all" | "unread"> filter value={filter} onChange={value => setUi({ filter: value })}
                                    options={[["all", "All", `All ${viewLabel}`], ["unread", "Unreads", `Unread ${viewLabel}`]]} />
                            </View>
                            <FlashList data={visible} numColumns={columns} ListEmptyComponent={<View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{query.trim() ? `No ${viewLabel} match your search`
                                    : filter === "unread" ? "You're all caught up" : `No ${viewLabel} to show`}</Text>
                            </View>}
                            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: grid ? SIDE_PADDING : 10, paddingTop: grid ? 14 : 10 }}
                            key={`${view}-${data.layout}-${columns}-${folderId ?? "root"}`} maintainVisibleContentPosition={{ disabled: true }}
                            getItemType={(item: t.DrawerItem) => item.kind ?? "dm"} keyExtractor={(item: t.DrawerItem) => `${view}:${item.id}`}
                            onScroll={(event: Native.NativeSyntheticEvent<Native.NativeScrollEvent>) => { scrollY.current = Math.max(0, event.nativeEvent.contentOffset.y); }}
                            renderItem={({ item, index }: Pick<Native.ListRenderItemInfo<t.DrawerItem>, "item" | "index">) => <View style={{
                                marginLeft: index % columns * columnOffset, width: grid ? ITEM_WIDTH : "100%",
                                paddingBottom: Math.floor(index / columns) < Math.floor((visible.length - 1) / columns) ? grid ? ITEM_GAP : 4 : 0,
                            }}>{renderItem(item)}</View>}
                            scrollEventThrottle={16} scrollEnabled={!active} showsVerticalScrollIndicator={false} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </View>
            {active ? <View accessibilityLabel={`Dragging ${active.source.name ?? "Folder"}`} accessibilityRole="summary" pointerEvents="none" ref={drag.previewRef}
                style={[styles.dragPreview, { left: grid ? 0 : panelLeft + 10, transform: previewTransform(active.point), width: previewWidth }]}>
                <Item item={active.source} layout={data.layout} previewWidth={previewWidth} />
            </View> : null}
            {active?.source.kind === "guild" && active.source.folderId && (drawerFolder || overlayFolder) && <View ref={drag.exitTarget} collapsable={false} onLayout={drag.measureExit} pointerEvents="none"
                accessible accessibilityRole="image" accessibilityLabel="Move server out of folder"
                accessibilityHint="Drag a server onto this arrow and release to make it standalone" style={[styles.exitTarget, { left: viewportWidth / 2 - 28, bottom: bottomInset + 24 }]}>
                <View style={{ height: 42, justifyContent: "center", transform: [{ scale: active?.outside ? 1.15 : 1 }] }}>
                    <Icon name="UndoIcon" color={active?.outside ? TEXT_BRAND : TEXT_DEFAULT} size={36} />
                </View>
            </View>}
        </View>;
    };
}

export function hitsDropTarget(point: t.DragPoint, bounds: Native.LayoutRectangle | undefined): boolean {
    if (!bounds || ![point.x, point.y, bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)
        || bounds.width <= 0 || bounds.height <= 0) return false;

    return point.x >= bounds.x - 8 && point.x <= bounds.x + bounds.width + 8
        && point.y >= bounds.y - 8 && point.y <= bounds.y + bounds.height + 8;
}
