import { findAsset } from "@api/assets";
import { before, instead } from "@api/patcher";
import { waitFor } from "@metro/internals/modules";
import { findByName, findByProps } from "@metro/wrappers";

import { PatchType } from "..";
import { state } from "../stuff/active";
import { getIconOverlay, getIconTint } from "../stuff/iconOverlays";
import { patches } from "../stuff/loader";
import modIcons from "../stuff/modIcons";
import { fixPath } from "../stuff/util";
import type { IconpackConfig } from "../types";

const Status = findByName("Status", false);
const RN = findByProps("Image", "View");
const OriginalImage = RN.Image;

export default function patchIcons(
    plus: any,
    tree: string[],
    config: IconpackConfig,
) {
    const { iconpack } = state.iconpack;
    if (config.biggerStatus) {
        patches.push(
            before("default", Status, ([props], ...args) => [
                {
                    ...props,
                    size: Math.floor(props.size * 1.5),
                },
                ...args,
            ]),
        );
    }

    if (plus.icons || plus.customOverlays || iconpack) {
        if (plus.icons) state.patches.push(PatchType.Icons);
        if (plus.customOverlays) {
            state.patches.push(PatchType.CustomIconOverlays);
        }
        if (iconpack) state.patches.push(PatchType.Iconpack);

        patches.push(
            waitFor(
                (exports: any) =>
                    typeof exports?.jsx === "function" &&
                    typeof exports?.jsxs === "function"
                        ? exports
                        : undefined,
                (ReactJSX: any) => {
                    function interceptJSX(args: any[], orig: Function) {
                        const [type, props, ...rest] = args;

                        if (type !== OriginalImage || !props) {
                            return (orig as any)(...args);
                        }

                        const patchedProps = { ...props };
                        const { source } = patchedProps;

                        let asset: any = null;

                        const modIcon = Object.entries(modIcons).find(
                            ([_, { raw }]) => source?.uri === raw,
                        );
                        if (modIcon) {
                            asset = {
                                httpServerLocation: "//_",
                                width: 64,
                                height: 64,
                                name: modIcon[0],
                                type: "png",
                            };
                        }
                        else if (
                            source
                            && typeof source.uri === "string"
                            && typeof source.width === "number"
                            && typeof source.height === "number"
                            && typeof source.file === "string"
                            && source.allowIconTheming
                        ) {
                            const [file, ...parent] = source.file
                                .split("/")
                                .reverse() as string[];
                            const [ext, ...base] = file.split(".").reverse();

                            asset = {
                                httpServerLocation: `//_/external${parent[0] ? "/" : ""}${parent.reverse().join("/")}`,
                                width: source.width,
                                height: source.height,
                                name: base.reverse().join("."),
                                type: ext,
                            };
                        }
                        else if (typeof source === "number") {
                            asset = findAsset(source);
                        }

                        if (!asset?.httpServerLocation) return orig(...args);

                        const assetIconpackLocation = iconpack
                            && fixPath(
                                [
                                    ...asset.httpServerLocation.split("/").slice(2),
                                    `${asset.name}${iconpack.suffix}.${asset.type}`,
                                ].join("/"),
                            );
                        const useIconpack = assetIconpackLocation
                            && (tree.length ? tree.includes(assetIconpackLocation) : true);

                        let overlayChildren: any;
                        let overlay: any;
                        if (
                            plus.customOverlays
                            && !useIconpack
                            && typeof source === "number"
                        ) {
                            const overlay = getIconOverlay(plus, source, patchedProps.style);
                            if (overlay) {
                                if (overlay.replace) patchedProps.source = findAsset(overlay.replace)?.id;
                                if (overlay.style) patchedProps.style = [patchedProps.style, overlay.style];
                                overlayChildren = overlay.children;
                            }
                        }

                        if (plus.icons) {
                            const tint = getIconTint(plus, source, asset.name);
                            if (tint) {
                                patchedProps.style = [patchedProps.style, { tintColor: tint }];
                            }
                        }

                        if (useIconpack) {
                            patchedProps.source = {
                                uri: iconpack.load + assetIconpackLocation,
                                headers: { "cache-control": "public, max-age=3600" },
                                width: asset.width,
                                height: asset.height,
                                original: patchedProps.source,
                            };
                        }

                        const imageEl = (orig as any)(OriginalImage, patchedProps, ...rest);

                        return overlayChildren
                            ? (orig as any)(RN.View, null, imageEl, overlayChildren)
                            : imageEl;
                    }

                    patches.push(
                        instead("jsx", ReactJSX, (args: any[], orig: Function) => interceptJSX(args, orig)),
                        instead("jsxs", ReactJSX, (args: any[], orig: Function) => interceptJSX(args, orig)),
                    );
                },
            )
        );
    }
}
