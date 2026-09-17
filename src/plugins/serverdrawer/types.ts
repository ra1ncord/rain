import type { ContextMenu } from "@metro/common/components";
import type { ComponentProps, ComponentType, ReactElement, ReactNode } from "react";
import type { LayoutRectangle, StyleProp, ViewProps, ViewStyle } from "react-native";

export interface BadgeState { readonly mentionCount: number; readonly unread: boolean }

export interface DrawerGuild extends BadgeState {
    readonly kind: "guild"; readonly id: string; readonly name: string; readonly avatarUri?: string; readonly folderId?: string;
}

export interface DrawerFolder extends BadgeState {
    readonly kind: "folder"; readonly id: string; readonly name: string | undefined;
    readonly color: number | undefined; readonly children: readonly DrawerGuild[];
}

export type DrawerNode = DrawerGuild | DrawerFolder;

export type DrawerLayout = "grid" | "list";

export type DrawerView = "dms" | "servers";

export interface ServerDrawerPreferences { readonly dmOrder: readonly string[]; readonly layout: DrawerLayout }

export interface DirectMessage extends BadgeState { readonly kind?: undefined; readonly id: string; readonly name: string; readonly avatarUri?: string; }

export interface ServerDrawerSnapshot {
    readonly nodes: readonly DrawerNode[]; readonly directMessages: readonly DirectMessage[];
    readonly selectedGuildId?: string; readonly selectedPrivateChannelId?: string;
}

export type DragPoint = Readonly<Pick<LayoutRectangle, "x" | "y">>;

export type DrawerItem = DrawerNode | DirectMessage;

export interface ReorderState extends ReorderGeometry {
    source: DrawerItem; items: readonly DrawerItem[];
    from: number; target: number; start: DragPoint; point: DragPoint;
    mergeSince?: number; moved?: boolean; outside?: boolean; openMenu?: () => void;
}

export interface NativeGestureModule { Gesture: { Pan(): NativePanGesture }; GestureDetector: ComponentType<{ children: ReactNode; gesture: NativePanGesture }> }

export interface NativePanGesture {
    activateAfterLongPress(duration: number): this; shouldCancelWhenOutside(cancel: boolean): this; runOnJS(enabled: boolean): this;
    onStart(callback: (event: NativePanEvent) => void): this; onUpdate(callback: (event: NativePanEvent) => void): this;
    onEnd(callback: (event: NativePanEvent, success: boolean) => void): this; onFinalize(callback: () => void): this;
}

export interface NativeGuildFolder { folderId?: string | number; folderName?: string; folderColor?: number; guildIds: string[] }

export interface NativeUser { globalName?: string; username: string; getAvatarURL(guildId: undefined, size: number, animated: boolean): string }

export interface ReadStore { getMentionCount(id: string): number; hasUnread(id: string): boolean }

export type PanelElement = ReactElement<Record<string, unknown>>;

export type PanelComponent = (props: PanelElement["props"]) => NativePanel;

export interface ServerDrawerSurfaceProps { bottomInset: number; onWidthChange(width: number): void }

export interface MenuItem { action(): unknown; label: string }

export type NativeMenuAnchor = Parameters<ComponentProps<typeof ContextMenu>["children"]>[0];

export interface GuildMenuProps { guild: DrawerGuild; children(props: NativeMenuAnchor): ReactNode }

export interface DragTargetProps {
    readonly children: ReactNode; readonly offset?: number;
    onCancel(): void; onDrop(point: DragPoint): void; onMove(point: DragPoint): void; onStart(point: DragPoint): void;
}

export interface TabsProps<Value extends string> {
    options: readonly (readonly [Value, string, string?])[]; value: Value; filter?: boolean; onChange(value: Value): void;
}

export interface ItemProps {
    readonly item: DrawerItem; readonly layout?: DrawerLayout; readonly selectedId?: string;
    readonly dragging?: boolean; readonly merging?: boolean; readonly onPress?: () => void; readonly menu?: NativeMenuAnchor;
    readonly compactSize?: number; readonly previewWidth?: number;
}

export interface ArtworkProps { item: DrawerItem; size: number; badged?: boolean; compact?: boolean; selected?: boolean }

export interface FolderTitleProps { folder: DrawerFolder; style: StyleProp<ViewStyle> }

export interface ElementProps { element: PanelElement }

export interface IconProps { name: string; color: string; size?: number; label?: string; onPress?(): void; buttonSize?: number }

export interface ReorderGeometry { columns: number; columnStep: number; layout: DrawerLayout; rowStep: number }

export interface DrawerState { expanded: boolean; view: DrawerView; filter: "all" | "unread"; query: string; folderId?: string; folderOverlayId?: string; }

export interface NativePanEvent { absoluteX: number; absoluteY: number }

export type NativePanel = ReactElement<{ children: [ReactNode, ReactElement<ViewProps>, ReactNode?] }>;

export interface FolderOverlayProps {
    folder: DrawerFolder; width: number; height: number; closeFolder(): void;
    renderItem(guild: DrawerGuild): ReactNode; handlers: ViewProps;
}
