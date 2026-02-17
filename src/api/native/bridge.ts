import { NativeModules } from "react-native";

export async function callBridgeMethod(method: string, ...args: any[]): Promise<any> {
    const [moduleName, methodName] = method.split(".");

    if (!moduleName || !methodName) {
        throw new Error(`Invalid method string format: ${method}. Expected "moduleName.methodName".`);
    }

    const nativeModule = NativeModules[moduleName];

    if (!nativeModule) {
        throw new Error(`Native module '${moduleName}' is not available. Please ensure it is correctly linked and initialized.`);
    }

    const nativeMethod = nativeModule[methodName];

    if (typeof nativeMethod !== "function") {
        throw new Error(`Method '${methodName}' not found or is not a function on native module '${moduleName}'. Found type: ${typeof nativeMethod}`);
    }

    try {
        const result = await nativeMethod(...args);
        return result;
    } catch (e: any) {
        throw new Error(`Error calling native method '${methodName}' on module '${moduleName}': ${e.message || e}`);
    }
}