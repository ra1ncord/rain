import { findByProps } from "@metro";

import { anonymizeSettings } from "../storage";

const CloudUpload = findByProps("CloudUpload")?.CloudUpload;

function getExtension(name: string): string {
    const index = name.lastIndexOf(".");
    return index > 0 ? name.slice(index) : "";
}

function buildName(original: string): string {
    const ext = getExtension(original);
    if (anonymizeSettings.useCustomName) {
        const custom = anonymizeSettings.customName.trim();
        if (custom) {
            return custom.includes(".") ? custom : custom + ext;
        }
    }
    return Math.random().toString(36).slice(2, 10) + ext;
}

export default function getUploadPatch() {
    if (!CloudUpload?.prototype?.reactNativeCompressAndExtractData) return [];

    const original = CloudUpload.prototype.reactNativeCompressAndExtractData;

    CloudUpload.prototype.reactNativeCompressAndExtractData = function (...args: any[]) {
        if (
            this?.item &&
            typeof this.item.filename === "string" &&
            this.item.filename.length > 0
        ) {
            this.item.filename = buildName(this.item.filename);
        }
        return original.apply(this, args);
    };

    return [
        () => {
            CloudUpload.prototype.reactNativeCompressAndExtractData = original;
            return true;
        },
    ];
}
