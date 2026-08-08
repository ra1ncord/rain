import { NativeFileModule } from "@api/native/modules";
import { useEffect, useState } from "react";
import { StyleProp, Text, TextStyle } from "react-native";

import { formatBytes } from "./utils";

const sizeCache: Record<string, number> = {};

interface SizeTagProps {
    url: string | null;
    style?: StyleProp<TextStyle>;
}

export function SizeTag({ url, style }: SizeTagProps) {
    const [size, setSize] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            if (!url) {
                if (isMounted) setLoading(false);
                return;
            }

            if (sizeCache[url] !== undefined) {
                if (isMounted) {
                    setSize(formatBytes(sizeCache[url]));
                    setLoading(false);
                }
                return;
            }

            try {
                const sizeBytes = await NativeFileModule.getSize(url);
                if (isMounted) {
                    if (typeof sizeBytes === "number" && sizeBytes > 0) {
                        sizeCache[url] = sizeBytes;
                        setSize(formatBytes(sizeBytes));
                    } else {
                        setSize("Unknown");
                    }
                }
            } catch {
                if (isMounted) {
                    setSize("Unknown");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [url]);

    if (loading) {
        return <Text style={style}>...</Text>;
    }

    return <Text style={style}>{size}</Text>;
}
