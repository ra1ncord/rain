import { useEffect, useRef,useState } from "react";
import { Animated, Dimensions,StyleSheet, View } from "react-native";

import { useLetItRainSettings } from "./storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface RainDropData {
    id: number;
    x: number;
    y: Animated.Value;
    opacity: Animated.Value;
    speed: number;
}

export default function RainOverlay() {
    const { settings } = useLetItRainSettings();
    const [rainDrops, setRainDrops] = useState<RainDropData[]>([]);
    const animationRef = useRef<Record<number, boolean>>({});

    useEffect(() => {
        const createDrop = (id: number): RainDropData => {
            const x = Math.random() * SCREEN_WIDTH;
            const y = new Animated.Value(-20);
            const opacity = new Animated.Value(0);
            const speed = (2000 + Math.random() * 1000) / settings.speed;

            return { id, x, y, opacity, speed };
        };

        const animateDrop = (drop: RainDropData) => {
            if (!animationRef.current[drop.id]) return;

            drop.y.setValue(-20);
            drop.opacity.setValue(0);

            Animated.parallel([
                Animated.timing(drop.y, {
                    toValue: SCREEN_HEIGHT + 20,
                    duration: drop.speed,
                    useNativeDriver: true
                }),
                Animated.sequence([
                    Animated.timing(drop.opacity, {
                        toValue: settings.transparency,
                        duration: drop.speed * 0.2,
                        useNativeDriver: true
                    }),
                    Animated.timing(drop.opacity, {
                        toValue: 0,
                        duration: drop.speed * 0.8,
                        useNativeDriver: true
                    })
                ])
            ]).start(() => {
                if (animationRef.current[drop.id]) {
                    animateDrop(drop);
                }
            });
        };

        // Initialize drops
        const newDrops: RainDropData[] = [];
        for (let i = 0; i < settings.amount; i++) {
            const drop = createDrop(i);
            newDrops.push(drop);
            animationRef.current[i] = true;

            // Stagger initial start
            setTimeout(() => animateDrop(drop), Math.random() * 3000);
        }

        setRainDrops(newDrops);

        return () => {
            animationRef.current = {};
        };
    }, [settings.amount, settings.speed, settings.transparency]);

    return (
        <View style={styles.container} pointerEvents="none">
            {rainDrops.map(drop => (
                <Animated.View
                    key={drop.id}
                    style={[
                        styles.rainDrop,
                        {
                            left: drop.x,
                            width: 2 * settings.size,
                            height: 12 * settings.size,
                            opacity: drop.opacity,
                            backgroundColor: settings.color,
                            transform: [{ translateY: drop.y }]
                        }
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        pointerEvents: "none"
    },
    rainDrop: {
        position: "absolute",
        borderRadius: 1,
    }
});
