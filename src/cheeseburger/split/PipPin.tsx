import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, Pressable, Text, View } from "react-native";

import { caught } from "../crash";
import { accentColor, withAlpha } from "../style/colors";
import { Cut } from "../style/shapes";
import { mineParticipant, onPinChange, participantForStream, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";
import { chromeShown, onChrome, watchChrome } from "./tiles";

const ICONS = ["PictureInPictureIcon", "PipIcon", "ic_pip", "PopoutIcon", "WindowLaunchIcon", "ScreenArrowIcon"];
const SIZE = 32;
const FILL = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 } as const;

let icon: number | null | undefined;
export let pinIconName = "";

function pinIcon(): number | null {
    if (icon !== undefined) return icon;
    icon = null;
    for (const n of ICONS) {
        const id = findAssetId(n);
        if (id !== undefined) {
            icon = id;
            pinIconName = n;
            break;
        }
    }
    return icon;
}

class Guard extends React.Component<{ children?: any; }, { failed: boolean; }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(e: any) {
        caught("pip pin", e);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

function Pin({ streamId }: { streamId: any; }) {
    const on = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        const a = onPinChange(force);
        const b = onChrome(force);
        const c = watchChrome();
        return () => {
            a();
            b();
            c();
        };
    }, []);
    if (!on || !chromeShown()) return null;
    const part = participantForStream(streamId);
    if (!part || mineParticipant(part)) return null;
    const pinnedHere = pinnedPip() === part.id;
    const accent = accentColor("#ff0048");
    const src = pinIcon();
    return (
        <View pointerEvents="box-none" style={FILL}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={pinnedHere ? "Unpin from picture in picture" : "Pin to picture in picture"}
                hitSlop={6}
                onPress={() => {
                    try {
                        pinPip(pinnedHere ? null : part.id);
                    } catch (e) {
                        caught("pip pin press", e);
                    }
                }}
                style={({ pressed }) => ({ position: "absolute", right: 10, bottom: 10, width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
            >
                <Cut size={8} radius={4} color={pinnedHere ? accent : withAlpha(accent, 0.45)} />
                {src != null
                    ? <Image source={src} style={{ width: 20, height: 20, tintColor: "#ffffff" }} />
                    : <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>PiP</Text>}
            </Pressable>
        </View>
    );
}

export function PipPin({ streamId }: { streamId: any; }) {
    return <Guard><Pin streamId={streamId} /></Guard>;
}
