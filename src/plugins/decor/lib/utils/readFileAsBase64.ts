import { ReactNative } from "@metro/common";

const FileManager = ReactNative.NativeModules.DCDFileManager ?? ReactNative.NativeModules.RTNFileManager;

export default async function readFileAsBase64(file: string) {
    if (file.startsWith("file://")) file = file.slice(7);
    return FileManager.readFile(file, "base64");
}
