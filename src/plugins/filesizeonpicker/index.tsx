import { before } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByDisplayName } from "@metro";
import { constants } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";
import { StyleSheet, View } from "react-native";

import { SizeTag } from "./SizeTag";

let unpatch: (() => void) | undefined;

export default definePlugin({
    name: "FileSizeOnPicker",
    description: "Show the file sizes in the media picker",
    author: [Contributors.MSMA, Developers.j],
    id: "filesizeonpicker",
    version: "1.0.0",
    start() {
        const styles = StyleSheet.create({
            sizeTagWrapper: {
                position: "relative",
            },
            sizeTag: {
                backgroundColor: "#1e1f2280",
                borderRadius: 4,
                paddingHorizontal: 4,
                paddingVertical: 2,
                position: "absolute",
                top: 3,
                left: 3,
            },
            sizeText: {
                includeFontPadding: false,
                fontSize: 10,
                color: "white",
                fontFamily: constants.Fonts?.PRIMARY_BOLD ?? "ggsans-Bold",
            },
        });

        const PressableModule = findByDisplayName("Pressable", false) ?? findByDisplayName("Pressable");
        const Pressable = PressableModule?.default ?? PressableModule;

        if (!Pressable) return;

        const target = Pressable.type ? Pressable : (Pressable.default ?? Pressable);

        unpatch = before("type", target, args => {
            if (!args || !args[0]) return;

            const [props] = args;

            if (!props) return;
            if (!props.modifiedByFileSizeOnPicker) {
                if (props?.children?.[0]?.props?.localImageSource) {
                    props.modifiedByFileSizeOnPicker = true;
                    props.originalChildren = props.children;

                    let fileUrl: string | null = null;
                    if (!props.skip) {
                        const img = findInReactTree(props.originalChildren, (m: any) => m.props?.localImageSource);
                        if (img?.props?.localImageSource?.uri) {
                            fileUrl = img.props.localImageSource.uri;
                        } else {
                            props.skip = true;
                            return;
                        }
                    } else {
                        return;
                    }

                    props.children = (
                        <View style={styles.sizeTagWrapper}>
                            {props.originalChildren}
                            <View style={styles.sizeTag}>
                                <SizeTag url={fileUrl} style={styles.sizeText} />
                            </View>
                        </View>
                    );
                }
            }
        });
    },
    stop() {
        unpatch?.();
        unpatch = undefined;
    },
});
