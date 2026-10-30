import { after } from "@api/patcher";
import { componentTarget } from "@api/react/componentTarget";
import { findInReactTree } from "@lib/utils";
import { logger } from "@lib/utils/logger";
import { findByFilePathLazy } from "@metro";
import { getLazyContext } from "@metro/lazy";
import { useColorsPref } from "@plugins/_core/painter/themes/preferences";
import { _colorRef } from "@plugins/_core/painter/themes/updater";
import chroma from "chroma-js";
import { ImageBackground, StyleSheet } from "react-native";

const Messages = findByFilePathLazy("modules/messages/native/Messages.tsx", false);

function ThemeBackground({ children }: { children: React.ReactNode; }) {
    const customBackground = useColorsPref(state => state.customBackground);

    if (!_colorRef.current
        || customBackground === "hidden"
        || !_colorRef.current.background?.url
        || _colorRef.current.background?.blur && (typeof _colorRef.current.background?.blur !== "number")
    ) {
        return children;
    }

    return <ImageBackground
        style={{ flex: 1, height: "100%" }}
        source={{ uri: _colorRef.current.background?.url }}
        blurRadius={_colorRef.current.background?.blur}
    >
        {children}
    </ImageBackground>;
}

export default function patchChatBackground() {
    try {
        let active = true;
        let restore: (() => unknown) | undefined;
        const context = getLazyContext(Messages);
        const cancel = context?.getExports(module => {
            if (!active) return;
            const target = componentTarget(module);
            if (!target) { logger.warn("Chat backgrounds unavailable for this Messages component"); return; }
            restore = after(target.key, target.parent, (_, ret) => {
                if (!_colorRef.current || !_colorRef.current.background?.url) return;
                const messagesComponent = findInReactTree(
                    ret,
                    x => x?.props && "HACK_fixModalInteraction" in x.props && x.props.style
                );
                if (messagesComponent) {
                    const flattened = StyleSheet.flatten(messagesComponent.props.style);
                    const backgroundColor = chroma(
                        flattened.backgroundColor || "black"
                    ).alpha(
                        1 - (_colorRef.current.background?.opacity ?? 1)
                    ).hex();
                    messagesComponent.props.style = StyleSheet.flatten([
                        messagesComponent.props.style,
                        { backgroundColor }
                    ]);
                }
                return <ThemeBackground>{ret}</ThemeBackground>;
            });
        });
        return () => { active = false; cancel?.(); restore?.(); };
    } catch (e) {
        logger.error("Failed to patch chat background.", e);
        return () => { };
    }
}
