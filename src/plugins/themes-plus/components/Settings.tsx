import { findAssetId } from "@api/assets";
import { openAlert } from "@api/ui/alerts";
import { createStyles } from "@api/ui/styles";
import { React, ReactNative as RN, url } from "@metro/common";
import { tokens } from "@metro/common";
import { Button, FloatingActionButton,Text } from "@metro/common/components";

import { PatchType } from "..";
import { state, useState } from "../stuff/active";
import load from "../stuff/loader";

const useStyles = createStyles({
    icon: {
        width: 16,
        height: 16,
        marginTop: 3,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    base: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
        gap: 15,
    },
    container: {
        width: "100%",
        padding: 12,
        backgroundColor: tokens.colors.CARD_PRIMARY_BG,
        borderColor: tokens.colors.BORDER_SUBTLE,
        borderWidth: 1,
        borderRadius: 16,
        gap: 2,
        overflow: "hidden",
    },
    bottomButtons: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    titleIcon: {
        tintColor: tokens.colors.TEXT_NORMAL,
        width: 20,
        height: 20,
    },
    btnIcon: {
        tintColor: tokens.colors.WHITE,
        width: 20,
        height: 20,
        marginRight: 4,
    },
    btnIconSecondary: {
        tintColor: tokens.colors.INTERACTIVE_NORMAL,
    },
    rowTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 2,
    },
});

const ListItem = ({
    state,
    index,
    children,
}: React.PropsWithChildren<{
    state: boolean;
    index: number;
    trolley: boolean;
}>) => {
    const styles = useStyles();
    const color = state ? tokens.colors.TEXT_POSITIVE : tokens.colors.TEXT_DANGER;

    return (
        <RN.View style={styles.row}>
            <RN.Image
                source={state
                    ? findAssetId("CircleCheckIcon-primary")
                    : findAssetId("CircleXIcon-primary")}
                style={[styles.icon, { tintColor: color }]}
                resizeMode="cover"
            />
            <Text
                variant={state ? "text-md/semibold" : "text-md/medium"}
                style={{ color }}
            >
                {children}
            </Text>
        </RN.View>
    );
};

export default function() {
    useState();
    const styles = useStyles();

    return (
        <RN.View style={styles.base}>
            <RN.View style={styles.container}>
                {state.loading
                    ? (
                        <RN.ActivityIndicator
                            size="large"
                            style={{ flex: 1, marginVertical: 30 }}
                        />
                    )
                    : (
                        <>
                            <RN.View style={styles.rowTitle}>
                                <RN.Image
                                    source={state.active
                                        ? findAssetId("CircleCheckIcon-primary")
                                        : findAssetId("CircleXIcon-primary")}
                                    style={styles.titleIcon}
                                    resizeMode="cover"
                                />
                                <Text
                                    variant="text-lg/semibold"
                                    style={{ color: tokens.colors.TEXT_NORMAL }}
                                >
                                    {state.active ? "Themes+ is active" : "Themes+ is inactive"}
                                </Text>
                            </RN.View>
                            {state.active
                                ? Object.values(PatchType)
                                    .map((x, i) => (
                                        <ListItem
                                            key={x}
                                            index={i}
                                            state={state.patches.includes(x)}
                                            trolley={false}
                                        >
                                            {x}
                                        </ListItem>
                                    ))
                                : state.inactive.map((x, i) => (
                                    <ListItem
                                        key={x}
                                        index={i}
                                        state={false}
                                        trolley={false}
                                    >
                                        {x}
                                    </ListItem>
                                ))}
                        </>
                    )}
            </RN.View>

            <RN.View style={styles.bottomButtons}>
                <Button
                    size="md"
                    variant="primary"
                    text="Reload"
                    onPress={() => !state.loading && load()}
                    loading={state.loading}
                    style={{ flex: 0.5 }}
                />
                <Button
                    size="md"
                    variant="secondary"
                    text="Config"
                    onPress={() => {
                        openAlert({
                            title: "Config",
                            content: "Config modal is not yet implemented in this port.",
                            confirmText: "OK",
                            onConfirm: () => {},
                        });
                    }}
                    style={{ flex: 0.5 }}
                />
            </RN.View>
            <FloatingActionButton
                icon={findAssetId("CircleQuestionIcon-primary")}
                onPress={() => url.openURL("https://github.com/nexpid/ThemesPlus")}
            />
        </RN.View>
    );
}
