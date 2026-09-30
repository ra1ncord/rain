import { findByName } from "@metro";
import { React } from "@metro/common";
import { Animated, Pressable, Text, View } from "react-native";

import { caught } from "../crash";
import { accentColor } from "../style/colors";
import { mineParticipant, onPinChange, participantForStream, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";
import { chromeShown, onChrome, watchChrome } from "./tiles";

const FADE_MS = 240;
const HIDE_DELAY = 160;
const FILL = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 } as const;
let buttonPill: any;
export let pinControlName = "";

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
    const previous = React.useRef<{ streamId: string; part: any; } | null>(null);
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
    const shown = chromeShown();
    const fade = React.useRef(new Animated.Value(shown ? 1 : 0)).current;
    const [interactive, setInteractive] = React.useState(shown);
    const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    React.useEffect(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = null;
        if (shown) {
            setInteractive(true);
            const anim = Animated.timing(fade, { toValue: 1, duration: FADE_MS, useNativeDriver: true });
            anim.start();
            return () => anim.stop();
        }
        hideTimer.current = setTimeout(() => {
            hideTimer.current = null;
            const anim = Animated.timing(fade, { toValue: 0, duration: FADE_MS, useNativeDriver: true });
            anim.start(({ finished }: any) => {
                if (finished) setInteractive(false);
            });
        }, HIDE_DELAY);
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            hideTimer.current = null;
            fade.stopAnimation();
        };
    }, [shown]);
    if (!on) return null;
    const sid = streamId == null ? "" : String(streamId);
    const found = participantForStream(streamId);
    if (found) previous.current = { streamId: sid, part: found };
    const part = found ?? (previous.current?.streamId === sid ? previous.current.part : null);
    if (!part || mineParticipant(part)) return null;
    const pinnedHere = pinnedPip() === part.id;
    const accent = accentColor("#ff0048");
    const name = String(part.userNick ?? part.user?.globalName ?? part.user?.username ?? "stream").trim().slice(0, 18);
    const label = pinnedHere ? "stop watching" : `focus ${name || "stream"}`;
    buttonPill ??= findByName("ButtonPill");
    pinControlName = buttonPill ? "ButtonPill" : "Pressable";
    const Pill = buttonPill;
    const content = <Text numberOfLines={1} style={{ color: "#ffffff", fontSize: 12, fontWeight: "600", maxWidth: 150 }}>{label}</Text>;
    return (
        <Animated.View pointerEvents={interactive ? "box-none" : "none"} style={[FILL, { opacity: fade }]}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={pinnedHere ? "Stop watching this stream in picture in picture" : `Focus ${name} in picture in picture`}
                hitSlop={8}
                onPress={() => {
                    try {
                        pinPip(pinnedHere ? null : part.id);
                    } catch (e) {
                        caught("pip pin press", e);
                    }
                }}
                style={({ pressed }) => ({ position: "absolute", right: 12, bottom: 12, minHeight: 38, maxWidth: 180, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: Pill ? "transparent" : "#00000085", borderWidth: 1, borderColor: pinnedHere ? accent : "#ffffff40", opacity: pressed ? 0.72 : 1 })}
            >
                {Pill ? <Pill>{content}</Pill> : <View>{content}</View>}
            </Pressable>
        </Animated.View>
    );
}

export function PipPin({ streamId }: { streamId: any; }) {
    return <Guard><Pin streamId={streamId} /></Guard>;
}
