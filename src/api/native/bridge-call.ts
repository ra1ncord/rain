// Keep transport selection separate so it can be tested without loading Metro.
export async function invokeRainBridge(
    host: Record<string, any>,
    legacyRead: (payload: object) => Promise<any>,
    method: string,
    args: any[],
): Promise<any> {
    const payload = { rain: { method, args } };
    const transport = typeof host.__RAIN_BRIDGE_CALL_ASYNC__ === "function"
        ? host.__RAIN_BRIDGE_CALL_ASYNC__ : host.__RAIN_BRIDGE_CALL_SYNC__;
    // If a JSI call fails, do not retry a potentially mutating operation.
    const response = typeof transport === "function"
        ? await transport(payload)
        : await legacyRead(payload);
    if (!response || typeof response !== "object") {
        throw new Error("Rain native bridge returned an invalid response");
    }
    if ("error" in response) throw new Error(String(response.error));
    if ("result" in response) return response.result;
    throw new Error("Rain native bridge response has no result");
}
