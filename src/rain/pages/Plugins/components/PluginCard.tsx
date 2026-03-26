import { findAssetId } from "@api/assets";
import { BundleUpdaterManager } from "@api/native/modules";
import { useSettings } from "@api/settings";
import { openAlert } from "@api/ui/alerts";
import { showSheet } from "@api/ui/sheets";
import { Strings } from "@i18n";
import { FluxDispatcher, NavigationNative, tokens } from "@metro/common";
import {
    AlertActionButton,
    AlertActions,
    AlertModal,
    Card,
    IconButton,
    Stack,
    TableSwitch,
    Text,
} from "@metro/common/components";
import { isPluginCore, usePluginSettings } from "@plugins";
import { CardWrapper } from "@rain/pages/Addon/AddonCard";
import { UnifiedPluginModel } from "@rain/pages/Plugins/models";
import chroma from "chroma-js";
import { createContext, useContext, useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";

const CardContext = createContext<{
  plugin: UnifiedPluginModel;
  result: Fuzzysort.KeysResult<UnifiedPluginModel>;
}>(null!);
const useCardContext = () => useContext(CardContext);

function getHighlightColor(): import("react-native").ColorValue {
    return chroma(tokens.unsafe_rawColors.YELLOW_300).alpha(0.3).hex();
}

function Title() {
    const { plugin, result } = useCardContext();
    const { pinnedPlugins, togglePinnedPlugin } = useSettings(s => s);
    const isPinned = pinnedPlugins?.includes(plugin.id);

    // could be empty if the plugin name is irrelevant!
    const highlightedNode = result[0].highlight((m, i) => (
        <Text key={i} style={{ backgroundColor: getHighlightColor() }}>
            {m}
        </Text>
    ));

    const textNode = (
        <Text numberOfLines={1} variant="heading-lg/semibold">
            {highlightedNode.length ? highlightedNode : plugin.name}
        </Text>
    );

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {isPinned && <Image source={findAssetId("PinIcon")} />}
            {textNode}
        </View>
    );
}

function Authors() {
    const { plugin, result } = useCardContext();

    const allAuthors = [...(plugin.developers ?? []), ...(plugin.contributors ?? [])];
    if (!allAuthors.length) return null;

    const highlightedNode = result[2].highlight((m, i) => (
        <Text key={i} style={{ backgroundColor: getHighlightColor() }}>
            {m}
        </Text>
    ));

    const authorText =
    highlightedNode.length > 0
        ? highlightedNode
        : allAuthors.map(a => a.name).join(", ");

    return (
        <View
            style={{ flexDirection: "row", flexWrap: "wrap", flexShrink: 1, gap: 4 }}
        >
            <Text variant="text-sm/semibold" color="text-muted">
                {Strings.AUTHOR_BY} {authorText}
            </Text>
        </View>
    );
}

function Description() {
    const { plugin, result } = useCardContext();

    // could be empty if the description is irrelevant with the search!
    const highlightedNode = result[1].highlight((m, i) => (
        <Text key={i} style={{ backgroundColor: getHighlightColor() }}>
            {m}
        </Text>
    ));

    return (
        <Text variant="text-md/medium">
            {highlightedNode.length ? highlightedNode : plugin.description}
        </Text>
    );
}

const Actions = () => {
    const { plugin } = useCardContext();
    const navigation = NavigationNative.useNavigation();
    const { pluginCard } = useSettings(s => s);

    return (
        <View style={{ flexDirection: "row", gap: 6 }}>
            {plugin.getPluginSettingsComponent?.() &&
                <IconButton
                    size="sm"
                    variant="secondary"
                    icon={findAssetId("SettingsIcon")}
                    onPress={() =>
                        navigation.push("RAIN_CUSTOM_PAGE", {
                            title: plugin.name,
                            render: plugin.getPluginSettingsComponent?.(),
                        })
                    }
                />
            }
            {pluginCard?.showInfoButton && (
                <IconButton
                    size="sm"
                    variant="secondary"
                    icon={findAssetId("CircleInformationIcon-primary")}
                    onPress={() =>
                        void showSheet(
                            "PluginInfoActionSheet",
                            plugin.resolveSheetComponent(),
                            { plugin, navigation },
                        )
                    }
                />
            )}
        </View>
    );
};

export default function PluginCard({
    result,
    item: plugin,
}: CardWrapper<UnifiedPluginModel>) {
    const [toggling, setToggling] = useState(false);
    const cardContextValue = useMemo(() => ({ plugin, result }), [plugin, result]);
    const core = isPluginCore(plugin.id);

    const pluginEnabled = usePluginSettings(s => s.settings[plugin.id]?.enabled ?? core);

    const handleToggle = async (v: boolean) => {
        if (core || toggling) return;
        setToggling(true);
        try {
            await plugin.toggle(v);

            FluxDispatcher.dispatch({ type: "RAIN_SETTING_UPDATED" });
        } finally {
            setToggling(false);
        }
        if (plugin.requiresRestart) {
            openAlert(
                "plugin-restart-alert",
                <AlertModal
                    title={Strings.RELOAD_DISCORD}
                    content={Strings.PLUGIN_RESTART_MESSAGE}
                    actions={
                        <AlertActions>
                            <AlertActionButton
                                text={Strings.RESTART_NOW}
                                variant="primary"
                                onPress={() => {
                                    BundleUpdaterManager.reload();
                                }}
                            />
                            <AlertActionButton text={Strings.RESTART_LATER} variant="secondary" />
                        </AlertActions>
                    }
                />,
            );
        }
    };

    const navigation = NavigationNative.useNavigation();
    const { pluginCard } = useSettings(s => s);
    const openOnPress = pluginCard?.openOnPress;

    return (
        <CardContext.Provider value={cardContextValue}>
            <Pressable
                style={({ pressed }) => openOnPress && pressed ? [{ opacity: 0.75 }] : []}
                onPress={openOnPress
                    ? () =>
                        void showSheet(
                            "PluginInfoActionSheet",
                            plugin.resolveSheetComponent(),
                            { plugin, navigation },
                        )
                    : undefined
                }
            >
                <Card>
                    <Stack spacing={16}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Title />
                                <Authors />
                            </View>

                            <View style={{ flexShrink: 0, minWidth: 100, alignItems: "flex-end" }}>
                                <Stack spacing={!plugin.getPluginSettingsComponent?.() && !pluginCard?.showInfoButton ? 45 : 12} direction="horizontal">
                                    <Actions />
                                    <View style={core ? { opacity: 0.5 } : undefined}>
                                        <TableSwitch
                                            value={pluginEnabled}
                                            disabled={core || toggling}
                                            onValueChange={handleToggle}
                                        />
                                    </View>
                                </Stack>
                            </View>
                        </View>
                        <Description />
                    </Stack>
                </Card>
            </Pressable>
        </CardContext.Provider>
    );
}
