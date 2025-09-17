import { Falsey } from "lodash";
import { FC, MutableRefObject, PropsWithoutRef, ReactNode, RefObject } from "react";
import type * as RN from "react-native";
import { ImageSourcePropType, PressableProps } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { LiteralUnion } from "type-fest";

type TextStyles = LiteralUnion<"heading-sm/normal" | "heading-sm/medium" | "heading-sm/semibold" | "heading-sm/bold" | "heading-sm/extrabold" | "heading-md/normal" | "heading-md/medium" | "heading-md/semibold" | "heading-md/bold" | "heading-md/extrabold" | "heading-lg/normal" | "heading-lg/medium" | "heading-lg/semibold" | "heading-lg/bold" | "heading-lg/extrabold" | "heading-xl/normal" | "heading-xl/medium" | "heading-xl/semibold" | "heading-xl/bold" | "heading-xl/extrabold" | "heading-xxl/normal" | "heading-xxl/medium" | "heading-xxl/semibold" | "heading-xxl/bold" | "heading-xxl/extrabold" | "eyebrow" | "heading-deprecated-12/normal" | "heading-deprecated-12/medium" | "heading-deprecated-12/semibold" | "heading-deprecated-12/bold" | "heading-deprecated-12/extrabold" | "redesign/heading-18/bold" | "text-xxs/normal" | "text-xxs/medium" | "text-xxs/semibold" | "text-xxs/bold" | "text-xs/normal" | "text-xs/medium" | "text-xs/semibold" | "text-xs/bold" | "text-sm/normal" | "text-sm/medium" | "text-sm/semibold" | "text-sm/bold" | "text-md/normal" | "text-md/medium" | "text-md/semibold" | "text-md/bold" | "text-lg/normal" | "text-lg/medium" | "text-lg/semibold" | "text-lg/bold" | "redesign/message-preview/normal" | "redesign/message-preview/medium" | "redesign/message-preview/semibold" | "redesign/message-preview/bold" | "redesign/channel-title/normal" | "redesign/channel-title/medium" | "redesign/channel-title/semibold" | "redesign/channel-title/bold" | "display-sm" | "display-md" | "display-lg", string>;
type ThemeColors = LiteralUnion<"action-sheet-gradient-bg" | "activity-card-background" | "activity-card-icon-overlay" | "alert-bg" | "android-navigation-bar-background" | "android-navigation-scrim-background" | "android-ripple" | "autocomplete-bg" | "background-accent" | "background-floating" | "background-mentioned" | "background-mentioned-hover" | "background-message-automod" | "background-message-automod-hover" | "background-message-highlight" | "background-message-highlight-hover" | "background-message-hover" | "background-mobile-primary" | "background-mobile-secondary" | "background-modifier-accent" | "background-modifier-accent-2" | "background-modifier-active" | "background-modifier-hover" | "background-modifier-selected" | "background-nested-floating" | "background-primary" | "background-secondary" | "background-secondary-alt" | "background-tertiary" | "badge-brand-bg" | "badge-brand-text" | "bg-backdrop" | "bg-backdrop-no-opacity" | "bg-base-primary" | "bg-base-secondary" | "bg-base-tertiary" | "bg-brand" | "bg-mod-faint" | "bg-mod-strong" | "bg-mod-subtle" | "bg-surface-overlay" | "bg-surface-overlay-tmp" | "bg-surface-raised" | "black" | "blur-fallback" | "blur-fallback-pressed" | "border-faint" | "border-strong" | "border-subtle" | "bug-reporter-modal-submitting-background" | "button-creator-revenue-background" | "button-danger-background" | "button-danger-background-active" | "button-danger-background-disabled" | "button-danger-background-hover" | "button-outline-brand-background" | "button-outline-brand-background-active" | "button-outline-brand-background-hover" | "button-outline-brand-border" | "button-outline-brand-border-active" | "button-outline-brand-border-hover" | "button-outline-brand-text" | "button-outline-brand-text-active" | "button-outline-brand-text-hover" | "button-outline-danger-background" | "button-outline-danger-background-active" | "button-outline-danger-background-hover" | "button-outline-danger-border" | "button-outline-danger-border-active" | "button-outline-danger-border-hover" | "button-outline-danger-text" | "button-outline-danger-text-active" | "button-outline-danger-text-hover" | "button-outline-positive-background" | "button-outline-positive-background-active" | "button-outline-positive-background-hover" | "button-outline-positive-border" | "button-outline-positive-border-active" | "button-outline-positive-border-hover" | "button-outline-positive-text" | "button-outline-positive-text-active" | "button-outline-positive-text-hover" | "button-outline-primary-background" | "button-outline-primary-background-active" | "button-outline-primary-background-hover" | "button-outline-primary-border" | "button-outline-primary-border-active" | "button-outline-primary-border-hover" | "button-outline-primary-text" | "button-outline-primary-text-active" | "button-outline-primary-text-hover" | "button-positive-background" | "button-positive-background-active" | "button-positive-background-disabled" | "button-positive-background-hover" | "button-secondary-background" | "button-secondary-background-active" | "button-secondary-background-disabled" | "button-secondary-background-hover" | "card-gradient-bg" | "card-gradient-pressed-bg" | "card-primary-bg" | "card-primary-pressed-bg" | "card-secondary-bg" | "card-secondary-pressed-bg" | "channel-icon" | "channel-text-area-placeholder" | "channels-default" | "channeltextarea-background" | "chat-background" | "chat-banner-bg" | "chat-border" | "chat-input-container-background" | "chat-swipe-to-reply-background" | "chat-swipe-to-reply-gradient-background" | "coachmark-bg" | "content-inventory-media-seekbar-container" | "content-inventory-overlay-text-primary" | "content-inventory-overlay-text-secondary" | "content-inventory-overlay-ui-mod" | "content-inventory-overlay-ui-mod-bg" | "context-menu-backdrop-background" | "control-brand-foreground" | "control-brand-foreground-new" | "creator-revenue-icon-gradient-end" | "creator-revenue-icon-gradient-start" | "creator-revenue-info-box-background" | "creator-revenue-info-box-border" | "creator-revenue-locked-channel-icon" | "creator-revenue-progress-bar" | "deprecated-card-bg" | "deprecated-card-editable-bg" | "deprecated-quickswitcher-input-background" | "deprecated-quickswitcher-input-placeholder" | "deprecated-store-bg" | "deprecated-text-input-bg" | "deprecated-text-input-border" | "deprecated-text-input-border-disabled" | "deprecated-text-input-border-hover" | "deprecated-text-input-prefix" | "display-banner-overflow-background" | "divider-strong" | "divider-subtle" | "embed-background" | "embed-background-alternate" | "embed-title" | "expression-picker-bg" | "focus-primary" | "forum-post-extra-media-count-container-background" | "forum-post-tag-background" | "guild-icon-inactive-bg" | "guild-icon-inactive-nested-bg" | "guild-notifications-bottom-sheet-pill-background" | "halo-positive" | "header-muted" | "header-primary" | "header-secondary" | "home-background" | "home-card-resting-border" | "icon-muted" | "icon-primary" | "icon-secondary" | "icon-transparent" | "info-box-background" | "info-danger-background" | "info-danger-foreground" | "info-danger-text" | "info-help-background" | "info-help-foreground" | "info-help-text" | "info-positive-background" | "info-positive-foreground" | "info-positive-text" | "info-warning-background" | "info-warning-foreground" | "info-warning-text" | "input-background" | "input-focused-border" | "input-placeholder-text" | "interactive-active" | "interactive-hover" | "interactive-muted" | "interactive-normal" | "legacy-android-blur-overlay-default" | "legacy-android-blur-overlay-ultra-thin" | "legacy-blur-fallback-default" | "legacy-blur-fallback-ultra-thin" | "live-stage-tile-border" | "logo-primary" | "mention-background" | "mention-foreground" | "menu-item-danger-active-bg" | "menu-item-danger-hover-bg" | "menu-item-default-active-bg" | "menu-item-default-hover-bg" | "modal-background" | "modal-footer-background" | "navigator-header-tint" | "panel-bg" | "polls-normal-fill-hover" | "polls-normal-image-background" | "polls-victor-fill" | "polls-voted-fill" | "premium-nitro-pink-text" | "profile-gradient-card-background" | "profile-gradient-message-input-border" | "profile-gradient-note-background" | "profile-gradient-overlay" | "profile-gradient-overlay-synced-with-user-theme" | "profile-gradient-profile-body-background-hover" | "profile-gradient-role-pill-background" | "profile-gradient-role-pill-border" | "profile-gradient-section-box" | "redesign-activity-card-background" | "redesign-activity-card-background-pressed" | "redesign-activity-card-badge-icon" | "redesign-activity-card-border" | "redesign-activity-card-overflow-background" | "redesign-button-active-background" | "redesign-button-active-pressed-background" | "redesign-button-active-text" | "redesign-button-danger-background" | "redesign-button-danger-pressed-background" | "redesign-button-danger-text" | "redesign-button-destructive-background" | "redesign-button-destructive-pressed-background" | "redesign-button-destructive-text" | "redesign-button-overlay-alpha-background" | "redesign-button-overlay-alpha-pressed-background" | "redesign-button-overlay-alpha-text" | "redesign-button-overlay-background" | "redesign-button-overlay-pressed-background" | "redesign-button-overlay-text" | "redesign-button-positive-background" | "redesign-button-positive-pressed-background" | "redesign-button-positive-text" | "redesign-button-primary-alt-background" | "redesign-button-primary-alt-border" | "redesign-button-primary-alt-on-blurple-background" | "redesign-button-primary-alt-on-blurple-border" | "redesign-button-primary-alt-on-blurple-pressed-background" | "redesign-button-primary-alt-on-blurple-pressed-border" | "redesign-button-primary-alt-on-blurple-text" | "redesign-button-primary-alt-pressed-background" | "redesign-button-primary-alt-pressed-border" | "redesign-button-primary-alt-pressed-text" | "redesign-button-primary-alt-text" | "redesign-button-primary-background" | "redesign-button-primary-on-blurple-pressed-text" | "redesign-button-primary-overlay-background" | "redesign-button-primary-overlay-pressed-background" | "redesign-button-primary-overlay-text" | "redesign-button-primary-pressed-background" | "redesign-button-primary-text" | "redesign-button-secondary-background" | "redesign-button-secondary-border" | "redesign-button-secondary-overlay-background" | "redesign-button-secondary-overlay-pressed-background" | "redesign-button-secondary-overlay-text" | "redesign-button-secondary-pressed-background" | "redesign-button-secondary-pressed-border" | "redesign-button-secondary-text" | "redesign-button-selected-background" | "redesign-button-selected-pressed-background" | "redesign-button-selected-text" | "redesign-button-tertiary-background" | "redesign-button-tertiary-pressed-background" | "redesign-button-tertiary-pressed-text" | "redesign-button-tertiary-text" | "redesign-channel-category-name-text" | "redesign-channel-message-preview-text" | "redesign-channel-name-muted-text" | "redesign-channel-name-text" | "redesign-chat-input-background" | "redesign-image-button-pressed-background" | "redesign-input-control-active-bg" | "redesign-input-control-selected" | "redesign-only-background-active" | "redesign-only-background-default" | "redesign-only-background-overlay" | "redesign-only-background-raised" | "redesign-only-background-sunken" | "scrollbar-auto-scrollbar-color-thumb" | "scrollbar-auto-scrollbar-color-track" | "scrollbar-auto-thumb" | "scrollbar-auto-track" | "scrollbar-thin-thumb" | "scrollbar-thin-track" | "spoiler-hidden-background" | "spoiler-revealed-background" | "stage-card-pill-bg" | "status-danger" | "status-danger-background" | "status-danger-text" | "status-dnd" | "status-idle" | "status-offline" | "status-online" | "status-positive" | "status-positive-background" | "status-positive-text" | "status-speaking" | "status-warning" | "status-warning-background" | "status-warning-text" | "text-brand" | "text-danger" | "text-link" | "text-link-low-saturation" | "text-low-contrast" | "text-message-preview-low-sat" | "text-muted" | "text-muted-on-default" | "text-normal" | "text-positive" | "text-primary" | "text-secondary" | "text-warning" | "textbox-markdown-syntax" | "theme-locked-blur-fallback" | "thread-channel-spine" | "toast-bg" | "typing-indicator-bg" | "user-profile-header-overflow-background" | "voice-video-video-tile-background" | "voice-video-video-tile-blur-fallback" | "white" | "you-bar-bg", string>;


type Nullish = null | undefined;

// Abandon all hope, ye who enter here
type Style = RN.ViewStyle & RN.ImageStyle & RN.TextStyle;

type InteractiveSize = "sm" | "md" | "lg";

// Buttons
type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "active";

interface ButtonProps {
    disabled?: boolean;
    onPress: () => void;
    loading?: boolean;
    variant?: LiteralUnion<ButtonVariant, string>;
    text?: string;
    size?: LiteralUnion<InteractiveSize, string>;
    iconPosition?: "start" | "end";
    scaleAmountInPx?: number;
    icon?: ImageSourcePropType | ReactNode;
    style?: Style;
    grow?: boolean;
}

export type Button = React.ForwardRefExoticComponent<ButtonProps>;

interface TwinButtonsProps {
    children: ReactNode;
}

export type TwinButtons = React.ComponentType<TwinButtonsProps>;

// Segmented Control
interface SegmentedControlItem {
    id: string;
    label: string;
    page?: JSX.Element | null;
}

export interface SegmentedControlStateArgs {
    items: SegmentedControlItem[];
    pageWidth: number;
    defaultIndex?: number;
}

export interface SegmentedControlState {
    activeIndex: SharedValue<number>;
    pagerRef: RefObject<unknown>;
    scrollTarget: SharedValue<number>;
    scrollOverflow: SharedValue<number>;
    scrollOffset: SharedValue<number>;
    items: SegmentedControlItem[];
    itemDimensions: SharedValue<unknown[]>;
    pageWidth: number;
    pressedIndex: SharedValue<number>;
    onPageChangeRef: MutableRefObject<unknown>; // { current: undefined }
    setActiveIndex: (index: number) => void;
    setItemDimensions: (index: number, dimensions: unknown[]) => void;
    useReducedMotion: boolean;
}

interface SegmentedControlProps {
    state: SegmentedControlState;
    variant?: string;
}

export type SegmentedControl = React.FC<SegmentedControlProps>;

interface SegmentedControlPagesProps {
    state: SegmentedControlState;
}

export type SegmentedControlPages = React.FC<SegmentedControlPagesProps>;

interface CompatSegmentedControlProps {
    values: string[];
    selectedSegmentIndex?: number;
    onValueChange?: (index: number) => void;
    onSetActiveIndex?: (index: number) => void;
}

export type CompatSegmentedControl = React.FC<CompatSegmentedControlProps>;

// TODO: Confirm if this is real
interface TextInputProps extends Omit<RN.TextInputProps, "onChange" | "onChangeText" | "value"> {
    defaultValue?: string;
    description?: string;
    editable?: boolean;
    errorMessage?: string;
    focusable?: boolean;
    grow?: boolean;
    isCentered?: boolean;
    isClearable?: boolean;
    isDisabled?: boolean;
    isRound?: boolean;
    label?: string;
    leadingIcon?: React.FC<any>;
    leadingPressableProps?: PressableProps;
    leadingText?: string;
    onChange?: (text: string) => void;
    size?: "sm" | "md" | "lg";
    state?: "error" | "default";
    style?: Style;
    trailingIcon?: React.FC<any>;
    trailingPressableProps?: PressableProps;
    trailingText?: string;
    value?: string | Nullish;
}

export type TextInput = React.FC<TextInputProps>;

interface RowButtonProps {
    variant?: LiteralUnion<ButtonVariant, string>;
    style?: Style;
    icon?: ImageSourcePropType | ReactNode;
    label: string | ReactNode;
    subLabel?: string | ReactNode;
    onPress: () => void;
    disabled?: boolean;
}

export type RowButton = React.FC<RowButtonProps>;

interface StackProps {
    /** defaults to vertical */
    direction?: "vertical" | "horizontal";
    /** defaults to 8 */
    spacing?: number;
}

export type Stack = React.FC<React.PropsWithChildren<StackProps> & RN.ViewProps>;

interface FABProps {
    icon: ImageSourcePropType | ReactNode;
    style?: Style;
    onPress: () => void;
    positionBottom?: number;
}

export type FloatingActionButton = React.FC<FABProps>;

interface ActionSheetProps {
    scrollable?: boolean;
}

export type ActionSheet = React.FC<React.PropsWithChildren<ActionSheetProps>>;

type TextProps = React.ComponentProps<typeof RN.Text> & {
    variant?: TextStyles;
    color?: ThemeColors;
    lineClamp?: number;
    maxFontSizeMultiplier?: number;
    style?: RN.TextStyle;
};

export type Text = React.FC<TextProps>;

interface IconButtonProps {
    label?: string;
    icon: ImageSourcePropType | ReactNode;
    onPress: () => void;
    disabled?: boolean;
    size?: InteractiveSize;
    variant?: ButtonVariant;
    style?: Style;
}

export type IconButton = React.FC<IconButtonProps>;

export type PressableScale = React.FC<PropsWithoutRef<typeof RN.Pressable>>;

interface TableRowBaseProps {
    arrow?: boolean;
    label: string | ReactNode;
    subLabel?: string | ReactNode;
    variant?: LiteralUnion<"danger", string>;
    icon?: JSX.Element | Falsey;
    disabled?: boolean;
    trailing?: ReactNode | React.ComponentType<any>;
}

interface TableRowProps extends TableRowBaseProps {
    onPress?: () => void;
}

export type TableRow = React.FC<TableRowProps> & {
    Icon: TableRowIcon;
    TrailingText: TableRowTrailingText;
    Arrow: FC<{}>;
};

interface TableRowTrailingTextProps {
    text: string;
}

export type TableRowTrailingText = FC<TableRowTrailingTextProps>;

interface TableRowIconProps {
    style?: RN.ImageStyle;
    variant?: LiteralUnion<"danger", string>,
    source: ImageSourcePropType | undefined;
}

export type TableRowIcon = React.FC<TableRowIconProps>;

interface TableRowGroupProps {
    title: string;
    children: ReactNode;
}

export type TableRowGroup = React.FC<TableRowGroupProps>;

interface TableRadioGroupProps {
    title: string;
    value: string;
    hasIcons?: boolean;
    onChange: <T extends string>(type: T) => void;
    children: ReactNode;
}

export type TableRadioGroup = FC<TableRadioGroupProps>;

interface TableRadioRowProps extends TableRowBaseProps {
    value: string;
}

export type TableRadioRow = FC<TableRadioRowProps>;

interface TableSwitchRowProps extends TableRowBaseProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
}

export type TableSwitchRow = FC<TableSwitchRowProps>;

interface TableCheckboxRowProps extends TableRowBaseProps {
    checked: boolean;
    onPress: () => void;
}

export type TableCheckboxRow = FC<TableCheckboxRowProps>;

interface ContextMenuItem {
    label: string;
    variant?: LiteralUnion<"destructive", string>;
    iconSource?: number;
    action: () => unknown;
}

interface ContextMenuProps {
    triggerOnLongPress?: boolean;
    items: ContextMenuItem[] | ContextMenuItem[][];
    align?: "left" | "right" | "above" | "below" | "auto" | null;
    title?: string;
    children: React.FC<Record<"onPress" | "onLongPress" | "accessibilityActions" | "onAccessibilityAction", any>>;
}

export type ContextMenu = FC<ContextMenuProps>;