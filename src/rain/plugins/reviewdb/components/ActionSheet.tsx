// Taken from https://github.com/nexpid/RevengePlugins/blob/main/src/stuff/components/ActionSheet.tsx
import { ReactNative as RN } from "@metro/common";
import { findByProps } from "@metro";
import type { ImageSourcePropType, ViewProps } from "react-native";
import { omit } from "es-toolkit";
import { find } from "../lib/utils";

const _ActionSheet =
    findByProps("ActionSheet")?.ActionSheet ??
    find((x) => x.render?.name === "ActionSheet"); // thank you to @pylixonly for fixing this

const { ActionSheetCloseButton, BottomSheetTitleHeader } = findByProps(
    "ActionSheetCloseButton",
);

export const LazyActionSheet = findByProps("openLazy", "hideActionSheet") as {
    openLazy: (component: Promise<any>, key: string, props?: object) => void;
    hideActionSheet: () => void;
};
export const { openLazy, hideActionSheet } = LazyActionSheet;

type ActionSheetProps = React.PropsWithChildren<
    ViewProps & {
        title: string;
        onClose?: () => void;
    }
>;

export const ActionSheet = ((props: ActionSheetProps) => {
    return (
        <_ActionSheet>
            <BottomSheetTitleHeader
                title={props.title}
                trailing={
                    <ActionSheetCloseButton
                        onPress={
                            props.onClose ??
                            (() => {
                                hideActionSheet();
                            })
                        }
                    />
                }
            />
            <RN.View {...omit(props, ["title", "onClose"])} />
        </_ActionSheet>
    );
}) as {
    (props: ActionSheetProps): any;
    open: <Sheet extends React.FunctionComponent<any>>(
        sheet: Sheet,
        props: Parameters<Sheet>[0],
    ) => void;
};

ActionSheet.open = (sheet, props) => {
    openLazy(
        new Promise((res) => {
            res({
                default: sheet,
            });
        }) as any,
        "ActionSheet",
        props,
    );
};
