import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { createStyles, TextStyleSheet } from "@api/ui/styles";
import { lazyDestructure } from "@lib/utils/lazy";
import { Card, FormRadio, FormSwitch, IconButton, LegacyFormRow, Stack, Text } from "@metro/common/components";
import { findByProps } from "@metro/wrappers";
import { TouchableOpacity, View } from "react-native";

const { hideActionSheet } = lazyDestructure(() => findByProps("openLazy", "hideActionSheet"));
const { showSimpleActionSheet } = lazyDestructure(() => findByProps("showSimpleActionSheet"));

// TODO: These styles work weirdly. Low DPI Has cramped text. Fix?
const useStyles = createStyles({
    card: {
        backgroundColor: semanticColors?.CARD_SECONDARY_BG,
        borderRadius: 12,
        overflow: "hidden"
    },
    header: {
        padding: 0,
    },
    headerLeading: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        scale: 1.2
    },
    headerLeadingCompact: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    headerTrailing: {
        display: "flex",
        flexDirection: "row",
        gap: 15,
        alignItems: "center"
    },
    headerLabel: {
        ...TextStyleSheet["heading-lg/semibold"],
    },
    headerLabelCompact: {
        ...TextStyleSheet["text-md/semibold"],
    },
    headerSubtitle: {
        ...TextStyleSheet["text-sm/semibold"],
        color: semanticColors.TEXT_MUTED,
    },
    descriptionLabel: {
        ...TextStyleSheet["text-md/semibold"],
        color: "text-strong",
    },
    actions: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 5
    },
    iconStyle: {
        tintColor: semanticColors.LOGO_PRIMARY,
        opacity: 0.2,
        height: 64,
        width: 64,
        left: void 0,
        right: "30%",
        top: "-10%"
    }
});

interface Action {
    icon: string;
    disabled?: boolean;
    onPress: () => void;
}

interface OverflowAction extends Action {
    label: string;
    isDestructive?: boolean;
}

export interface CardWrapper<T> {
    item: T;
    result: Fuzzysort.KeysResult<T>;
    compact?: boolean;
}

export interface CompactCardWrapper<T> extends CardWrapper<T> {
    compact: true;
}

interface CardProps {
    index?: number;
    compact?: boolean;
    headerLabel: string;
    headerSublabel?: string;
    headerIcon?: string;
    toggleType?: "switch" | "radio";
    toggleValue: () => boolean;
    onToggleChange?: (v: boolean) => void;
    descriptionLabel?: string;
    actions?: Action[];
    overflowTitle?: string;
    overflowActions?: OverflowAction[];
    headerLabelStyle?: object;
    headerSublabelStyle?: object;
    headerLabelVariant?: string;
    headerSublabelVariant?: string;
    headerSublabelColor?: string;
}

export default function AddonCard(props: CardProps) {
    const styles = useStyles();

    const leadingStyle = props.compact ? styles.headerLeadingCompact : styles.headerLeading;
    const labelStyle = props.compact ? styles.headerLabelCompact : styles.headerLabel;

    if (props.compact) {
        return (
            <Card style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={leadingStyle}>
                        <Text variant="text-md/semibold" numberOfLines={1} ellipsizeMode="tail" style={labelStyle}>{props.headerLabel}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {props.actions?.map(({ icon, onPress, disabled }) => (
                            <IconButton
                                key={icon}
                                onPress={onPress}
                                disabled={disabled}
                                size="sm"
                                variant="secondary"
                                icon={findAssetId(icon)}
                            />
                        ))}
                        {props.toggleType && (props.toggleType === "switch" ?
                            <FormSwitch
                                value={props.toggleValue()}
                                onValueChange={props.onToggleChange}
                            />
                            :
                            <TouchableOpacity onPress={() => {
                                props.onToggleChange?.(!props.toggleValue());
                            }}>
                                <FormRadio selected={props.toggleValue()} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Card >
        );
    }

    return (
        <Card>
            <Stack spacing={16}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={leadingStyle}>
                        <Text variant={props.headerLabelVariant} numberOfLines={1} ellipsizeMode="tail" style={{ ...labelStyle, ...props.headerLabelStyle }}>{props.headerLabel}</Text>
                        {props.headerSublabel && (
                            <Text variant={props.headerSublabelVariant} color={props.headerSublabelColor} style={{ ...styles.headerSubtitle, ...props.headerSublabelStyle }}>{props.headerSublabel}</Text>
                        )}
                    </View>
                    <View style={[styles.headerTrailing, { marginLeft: "auto" }]}>
                        <View style={styles.actions}>
                            {props.overflowActions &&
                                <IconButton
                                    onPress={() => showSimpleActionSheet({
                                        key: "CardOverflow",
                                        header: {
                                            title: props.overflowTitle,
                                            icon: props.headerIcon && <LegacyFormRow.Icon style={{ marginRight: 8 }} source={findAssetId(props.headerIcon)} />,
                                            onClose: () => hideActionSheet(),
                                        },
                                        options: props.overflowActions?.map(i => ({
                                            ...i,
                                            icon: findAssetId(i.icon)
                                        })),
                                    })}
                                    size="sm"
                                    variant="secondary"
                                    icon={findAssetId("CircleInformationIcon-primary")}
                                />}
                            {props.actions?.map(({ icon, onPress, disabled }) => (
                                <IconButton
                                    onPress={onPress}
                                    disabled={disabled}
                                    size="sm"
                                    variant="secondary"
                                    icon={findAssetId(icon)}
                                />
                            ))}
                        </View>
                        {props.toggleType && (props.toggleType === "switch" ?
                            <FormSwitch
                                value={props.toggleValue()}
                                onValueChange={props.onToggleChange}
                            />
                            :
                            <TouchableOpacity onPress={() => {
                                props.onToggleChange?.(!props.toggleValue());
                            }}>
                                <FormRadio selected={props.toggleValue()} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {props.descriptionLabel && <Text variant="text-md/medium">
                    {props.descriptionLabel}
                </Text>}
            </Stack>
        </Card >
    );
}
