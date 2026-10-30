import { invokeRainBridge } from "./bridge-call";
import { getNativeModule } from "./modules";

function legacyRead(payload: object): Promise<any> {
    const bridge = getNativeModule<{
    readAsDataURL(map: object): Promise<any>
        }>("FileReaderModule");
    if (!bridge) throw new Error("No supported Rain native bridge is available");
    return bridge.readAsDataURL(payload);
}

export async function callBridgeMethod(method: string, ...args: any[]): Promise<any> {
    try {
        return await invokeRainBridge(globalThis, legacyRead, method, args);
    } catch (error) {
        throw new Error(`Call failed: ${error}`);
    }
}
