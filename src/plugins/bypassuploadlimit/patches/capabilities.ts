// SPDX-License-Identifier: MPL-2.0
export function resolveFileUtils(find: (...props: string[]) => any) {
    const utils = find("maxFileSize", "getUploadFileSizeSum") ?? find("maxFileSize");
    if (typeof utils?.maxFileSize !== "function") throw new Error("Discord upload size API is unavailable");
    return utils;
}

export function installHooks(installers: (() => (() => boolean))[]) {
    const undo: (() => boolean)[] = [];
    try {
        for (const install of installers) undo.push(install());
        return undo;
    } catch (error) {
        for (const restore of undo.reverse()) {
            try { restore(); } catch {}
        }
        throw error;
    }
}
