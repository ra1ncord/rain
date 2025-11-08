import { getLoaderName, getLoaderVersion, isThemeSupported } from "@lib/api/native/loader";
import { NativeClientInfoModule, NativeDeviceModule } from "@lib/api/native/modules";
import { after } from "@lib/api/patcher";
import { version } from "bunny-build-info";
import { Platform, type PlatformConstants } from "react-native";

export interface RNConstants extends PlatformConstants {
    // Android
    Version: number;
    Release: string;
    Serial: string;
    Fingerprint: string;
    Model: string;
    Brand: string;
    Manufacturer: string;
    ServerHost?: string;

    // iOS
    forceTouchAvailable: boolean;
    interfaceIdiom: string;
    osVersion: string;
    systemName: string;
}

/**
 * @internal
 */

let socket: WebSocket;
export function connectToDebugger(url: string) {
    if (socket !== undefined && socket.readyState !== WebSocket.CLOSED) socket.close();

    if (!url) {
        return;
    }

    socket = new WebSocket(`ws://${url}`);

    socket.addEventListener("message", (message: any) => {
        try {
            (0, eval)(message.data);
        } catch (e) {
            console.error(e);
        }
    });

    socket.addEventListener("error", (err: any) => {
        console.log(`Debugger error: ${err.message}`);
    });
}

/**
 * @internal
 */
export function patchLogHook() {
    const unpatch = after("nativeLoggingHook", globalThis, args => {
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ message: args[0], level: args[1] }));
    });

    return () => {
        socket && socket.close();
        unpatch();
    };
}

/** @internal */
export const versionHash = version;

export function getDebugInfo() {
    // Hermes
    const hermesProps = window.HermesInternal.getRuntimeProperties();
    const hermesVer = hermesProps["OSS Release Version"];
    const padding = "for RN ";

    // RN
    const PlatformConstants = Platform.constants as RNConstants;
    const rnVer = PlatformConstants.reactNativeVersion;

    return {
        /**
         * @deprecated use `bunny` field
         * */
        vendetta: {
            version: versionHash.split("-")[0],
            loader: getLoaderName(),
        },
        bunny: {
            version: versionHash,
            loader: {
                name: getLoaderName(),
                version: getLoaderVersion()
            }
        },
        discord: {
            version: NativeClientInfoModule.getConstants().Version,
            build: NativeClientInfoModule.getConstants().Build,
        },
        react: {
            version: React.version,
            nativeVersion: hermesVer.startsWith(padding) ? hermesVer.substring(padding.length) : `${rnVer.major}.${rnVer.minor}.${rnVer.patch}`,
        },
        hermes: {
            version: hermesVer,
            buildType: hermesProps.Build,
            bytecodeVersion: hermesProps["Bytecode Version"],
        },
        ...Platform.select(
            {
                android: {
                    os: {
                        name: "Android",
                        version: PlatformConstants.Release,
                        sdk: PlatformConstants.Version
                    },
                },
                ios: {
                    os: {
                        name: PlatformConstants.systemName,
                        version: PlatformConstants.osVersion
                    },
                }
            }
        )!,
        ...Platform.select(
            {
                android: {
                    device: {
                        manufacturer: PlatformConstants.Manufacturer,
                        brand: PlatformConstants.Brand,
                        model: PlatformConstants.Model,
                        codename: NativeDeviceModule.device
                    }
                },
                ios: {
                    device: {
                        manufacturer: NativeDeviceModule.deviceManufacturer,
                        brand: NativeDeviceModule.deviceBrand,
                        model: NativeDeviceModule.deviceModel,
                        codename: NativeDeviceModule.device
                    }
                }
            }
        )!
    };
}
