import { findAssetId } from "@api/assets";
import { after, before } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { findInReactTree } from "@lib/utils";
import { findByProps } from "@metro";
import { React } from "@metro/common";
import { formatString } from "@rain/i18n";

import { useTextReplaceSettings } from "../storage";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow;
const DownloadIcon = findAssetId("DownloadIcon");
const JSON_CODEBLOCK_PATTERN = /^```(?:json)\n([\s\S]*?)```$/gm;

export default function patchMessageLongPressActionSheet() {
    return before("openLazy", LazyActionSheet, ([component, key, msg]) => {
        if (key !== "MessageLongPressActionSheet") return;
        const content = msg?.message?.content;
        if (!content) return;

        component.then((instance: any) => {
            const unpatch = after("default", instance, (_, res) => {
                React.useEffect(() => {
                    return () => {
                        unpatch();
                    };
                }, []);

                const rules = [...content.matchAll(JSON_CODEBLOCK_PATTERN)]
                    .map(m => {
                        try {
                            return JSON.parse(m[1]);
                        } catch {
                            return null;
                        }
                    })
                    .filter(
                        r =>
                            r &&
                            typeof r.name === "string" &&
                            typeof r.match === "string" &&
                            typeof r.replace === "string",
                    );

                if (!rules.length) return;

                const buttons = findInReactTree(
                    res,
                    x => Array.isArray(x) && x.some(c => c?.type?.name === "ActionSheetRow"),
                );
                if (!buttons) return;

                rules.forEach((rule: any) => {
                    buttons.unshift(
                        <ActionSheetRow
                            label={formatString("PLUGINS.CUSTOM.TEXTREPLACE.IMPORT_RULE", { rulename: rule.name })}
                            icon={<ActionSheetRow.Icon source={DownloadIcon} />}
                            onPress={() => {
                                LazyActionSheet.hideActionSheet();
                                const currentRules = useTextReplaceSettings.getState().rules;
                                useTextReplaceSettings.getState().updateSettings({ rules: [...currentRules, rule] });
                                showToast(formatString("PLUGINS.CUSTOM.TEXTREPLACE.IMPORTED_RULE", { rulename: rule.name }), DownloadIcon);
                            }}
                        />,
                    );
                });
            });
        });
    });
}
