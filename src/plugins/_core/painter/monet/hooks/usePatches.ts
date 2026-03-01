import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import safeFetch from "@lib/utils/safeFetch";
import { React } from "@metro/common";

import { useMonetSettings } from "../storage";
import { parse } from "../stuff/jsoncParser";
import type { Patches } from "../types";

const revalidateTimeout = 5000;
const refetchTimeout = 15 * 6000;

const patchesSymbol = Symbol.for("monettheme.cache.patches");

let data = {
    canRefetch: 0,
    patches: null,
} as {
    canRefetch: number;
    patches: Patches | null;
};

if (
    !Number.isNaN((window as any)[patchesSymbol]?.canRefetch)
    && typeof (window as any)[patchesSymbol]?.patches === "object"
) {
    data = {
        canRefetch: (window as any)[patchesSymbol].canRefetch,
        patches: JSON.parse(JSON.stringify((window as any)[patchesSymbol].patches)),
    };
}

(window as any)[patchesSymbol] = data;

const uponRevalidate = new Set<(data: any) => void>();
let canRevalidate = 0;

function getPatchesURL(): string {
    const settings = useMonetSettings.getState();
    const commit = settings.patches.commit ?? "main";
    return `https://raw.githubusercontent.com/nexpid/VendettaMonetTheme/${commit}/patches.jsonc`;
}

const devPatchesURL = "http://192.168.2.22:8730/patches.jsonc";

const refetch = async () => {
    const settings = useMonetSettings.getState();
    const url = settings.patches.from === "local" ? devPatchesURL : getPatchesURL();

    const patches = await safeFetch(url, { cache: "no-store" })
        .then(x =>
            x.text().then(text => {
                try {
                    return parse(text.replace(/\r/g, ""));
                } catch (err: any) {
                    showToast("Failed to parse color patches!", findAssetId("CircleXIcon-primary"));
                    console.error("usePatches refetch error (parse)", err);
                    return null;
                }
            }),
        )
        .catch((err: any) => {
            showToast("Failed to fetch color patches!", findAssetId("CircleXIcon-primary"));
            console.error("usePatches refetch error (fetch)", err);
            return null;
        });

    data.patches = patches;
    data.canRefetch = Date.now() + refetchTimeout;

    for (const fnc of uponRevalidate) fnc(patches);
};

const usePatches = (() => {
    const [patches, setPatches] = React.useState(data.patches);
    const revalFunc = (data: any) => setPatches(data);

    React.useEffect(() => {
        uponRevalidate.add(revalFunc);
        return () => void uponRevalidate.delete(revalFunc);
    });

    React.useEffect(
        () => void ((!patches || data.canRefetch >= Date.now()) && refetch()),
        [],
    );

    return {
        patches,
        revalidate: async () => {
            if (canRevalidate < Date.now()) return;
            canRevalidate = Number.NaN;

            await refetch();
            canRevalidate = Date.now() + revalidateTimeout;
        },
    };
}) as {
    (): { patches: Patches | null; revalidate: () => Promise<void> };
    patches: Promise<Patches | null> | Patches | null;
};

Object.defineProperty(usePatches, "patches", {
    get: () => !data.patches ? refetch().then(() => data.patches) : data.patches,
});

export default usePatches;
