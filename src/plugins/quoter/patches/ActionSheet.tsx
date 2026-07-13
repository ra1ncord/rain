import { findAssetId } from "@api/assets";
import { after, before } from "@api/patcher";
import { semanticColors } from "@api/ui/components/color";
import { findInReactTree } from "@lib/utils";
import { logger } from "@lib/utils/logger";
import { React, ReactNative } from "@metro/common";
import { Forms } from "@metro/common/components";
import { findByPropsLazy } from "@metro/wrappers";
import { Platform } from "react-native";

import { openQuoteModal } from "../components/QuotePreview";

const LazyActionSheet = findByPropsLazy("openLazy", "hideActionSheet");

const styles = {
    iconComponent: {
        width: 24,
        height: 24,
        tintColor: semanticColors.INTERACTIVE_NORMAL,
    },
};

function injectQuoteRow(sheet: any, message: any) {
    const icon = findAssetId("QuoteIcon") ?? findAssetId("ImageIcon") ?? findAssetId("ChatXIcon");
    const onPress = () => {
        LazyActionSheet.hideActionSheet();
        openQuoteModal(message);
    };

    const actionSheetContainer = findInReactTree(
        sheet,
        x => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
    );

    const middleGroup = actionSheetContainer?.[1];
    const children = middleGroup?.props?.children;

    if (Array.isArray(children) && children.length) {
        if (children.some((child: any) => child?.key === "quoter")) return;

        const template = children.find((child: any) => child?.type);
        if (!template) return;

        const ActionSheetRow = template.type;
        const templateIcon = template.props?.icon;
        const quoteButton = (
            <ActionSheetRow
                label="Quote"
                icon={templateIcon
                    ? {
                        $$typeof: templateIcon.$$typeof,
                        type: templateIcon.type,
                        key: null,
                        ref: null,
                        props: {
                            IconComponent: () => (
                                <ReactNative.Image
                                    resizeMode="cover"
                                    style={styles.iconComponent}
                                    source={icon}
                                />
                            ),
                        },
                    }
                    : undefined}
                onPress={onPress}
                key="quoter"
            />
        );

        const copyIndex = children.findIndex((child: any) =>
            child?.props?.label?.toUpperCase?.()?.includes("COPY") ||
            child?.props?.message?.toUpperCase?.()?.includes("COPY")
        );

        if (copyIndex !== -1) {
            children.splice(copyIndex, 0, quoteButton);
        } else {
            children.push(quoteButton);
        }
        return;
    }

    const buttons = findInReactTree(
        sheet,
        x => x?.[0]?.type?.name === "ButtonRow",
    );

    if (Array.isArray(buttons)) {
        if (buttons.some((child: any) => child?.key === "quoter")) return;
        const { FormRow, FormIcon } = Forms;
        buttons.push(
            <FormRow
                key="quoter"
                label="Quote"
                leading={<FormIcon style={{ opacity: 1 }} source={icon} />}
                onPress={onPress}
            />,
        );
    } else {
        logger.log("[Quoter] Could not find a known ActionSheet layout");
    }
}

export default () => before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    // The quote is rendered via a hidden WebView, whose native view (RNCWebView)
    // only ships in rain's Android app — mounting it elsewhere crashes natively.
    // `platforms` on the plugin manifest only hides Quoter from the iOS Plugins
    // list, it doesn't stop start() running there (e.g. a synced enabled-state
    // from another device), so this check is the actual crash prevention.
    if (Platform.OS !== "android") return;
    const message = msg?.message;
    if (key !== "MessageLongPressActionSheet" || !message?.content) return;

    Promise.resolve(component).then((instance: any) => {
        if (!instance || typeof instance.default !== "function") return;

        const unpatch = after("default", instance, (_, sheet) => {
            React.useEffect(() => () => { unpatch(); }, []);

            // Never let an unexpected sheet shape crash the whole action
            // sheet — worst case the Quote row is simply not added.
            try {
                injectQuoteRow(sheet, message);
            } catch (error) {
                logger.error("[Quoter] Failed to inject Quote row:", error);
            }
        });
    }).catch(() => { });
});
