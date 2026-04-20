import { ReactNative as RN } from "@metro/common";

export function UpsideDown({ children }: { children: any; }) {
    return (
        <RN.View
            style={{
                transform: [{ scaleY: -1 }],
            }}
        >
            {children}
        </RN.View>
    );
}
