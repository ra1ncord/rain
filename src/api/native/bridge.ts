import { getNativeModule } from "./modules";

const BridgePromise = getNativeModule<{
    readAsDataURL(map: object): Promise<any>
        }>("FileReaderModule")!;

function makePayload(name: string, args: any[]): object {
    return {
        rain: {
            method: name,
            args: args,
        },
    };
}

export async function callBridgeMethod(method: string, ...args: any[]): Promise<any> {
    try {
        const result = await BridgePromise.readAsDataURL(
            makePayload(method, args),
        );

        if ("error" in result) throw result.error;
        if ("result" in result) return result.result;

        throw "The module did not return a valid result. The native hook must have failed.";
    } catch (error) {
        throw new Error(`Call failed: ${error}`);
    }
}
