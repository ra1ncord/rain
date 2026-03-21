import { createPluginStore } from "@api/storage";

export type HostType = "catbox" | "litterbox" | "uguu" | "zipline";

export interface UploaderSettings {
    /** Always upload to the selected host, ignoring the file size threshold. */
    alwaysUpload: boolean;
    /** Wether to use hyperlink or not. */
    useHyperlink: boolean;
    /** What to do after upload: clipboard, insertonly, insert, nextmsg. */
    uploadAction: "clipboard" | "insertonly" | "insert" | "nextmsg";
    /** The file hosting service to use. */
    selectedHost: HostType;
    /** Catbox user hash for persistent file storage (optional). */
    userHash: string;
    /** Default Litterbox expiry duration in hours (1, 12, 24, or 72). */
    litterboxDuration: string;
    /** The Zipline server url the user is using. */
    ziplineServerURL: string;
    /** The users Zipline token. */
    ziplineUserToken: string;
    /** Default Zipline expiry duration in hours. */
    ziplineDuration: string;
    /** Default Zipline file name. */
    ziplineFileNameFormat: string;
}

export const {
    useStore: useUploaderSettings,
    settings: uploaderSettings,
} = createPluginStore<UploaderSettings>("bypassuploadlimit", {
    alwaysUpload: false,
    useHyperlink: false,
    uploadAction: "clipboard",
    selectedHost: "catbox",
    userHash: "",
    litterboxDuration: "1",
    ziplineServerURL: "",
    ziplineUserToken: "",
    ziplineFileNameFormat: "date",
    ziplineDuration: "never",
});
