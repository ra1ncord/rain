import { NativeFileModule } from "@api/native/modules";
import { findByProps } from "@metro";

export interface PickedFile {
    name: string;
    content: string;
}

function getPicker(): ((opts: any) => Promise<any>) | undefined {
    const nmp = (window as any).nativeModuleProxy ?? {};
    const turbo = (globalThis as any).__turboModuleProxy;
    const native = (name: string) => turbo?.(name) ?? nmp[name];

    const js = findByProps("pickSingle", "isCancel") ?? findByProps("pick", "isCancel", "types");
    if (js?.pickSingle) return opts => js.pickSingle(opts);
    if (js?.pick) return async opts => (await js.pick(opts))?.[0];

    for (const name of ["RNDocumentPicker", "NativeDocumentPicker", "RNCDocumentPicker"]) {
        const mod = native(name);
        if (mod?.pick) return async opts => {
            const res = await mod.pick({ allowMultiSelection: false, mode: "import", ...opts });
            return Array.isArray(res) ? res[0] : res;
        };
    }

    return undefined;
}

export function isFilePickerAvailable() {
    try {
        return !!getPicker();
    } catch {
        return false;
    }
}

async function readUri(uri: string): Promise<string> {
    try {
        const res = await fetch(uri);
        const text = await res.text();
        if (text) return text;
    } catch { }

    const path = decodeURIComponent(uri.replace(/^file:\/\//, ""));
    return await NativeFileModule.readFile(path, "utf8");
}

export async function pickTextFile(): Promise<PickedFile | null> {
    const pick = getPicker();
    if (!pick) throw new Error("No file picker, copy the file and paste it");

    let res: any;
    try {
        res = await pick({ type: ["*/*"], copyTo: "cachesDirectory" });
    } catch (e: any) {
        if (/cancel/i.test(String(e?.code ?? e?.message ?? e))) return null;
        throw e;
    }
    if (!res) return null;

    const uri = res.fileCopyUri ?? res.uri;
    if (!uri) throw new Error("No file");

    return { name: res.name ?? String(uri).split("/").pop() ?? "file", content: await readUri(uri) };
}
