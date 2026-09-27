import { Text } from "@metro/common/components";
import { useEffect, useState } from "react";

const listeners = new Set<(v: number) => void>();

export function emitSliderValue(v: number) {
    listeners.forEach(l => l(v));
}

export default function VolumeLabel({ value }: { value: number; }) {
    const [v, setV] = useState(value);

    useEffect(() => setV(value), [value]);
    useEffect(() => {
        listeners.add(setV);
        return () => void listeners.delete(setV);
    }, []);

    return (
        <Text variant="text-sm/semibold" color="text-normal" style={{ minWidth: 48, textAlign: "right", marginLeft: 8 }}>
            {`${Math.round(v / 10) * 10}%`}
        </Text>
    );
}
