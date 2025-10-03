declare module "~plugins" {
    const plugins: Record<string, import("./plugins/types").PluginDef>;
    export default plugins;
    export const PluginMeta: Record<string, {
        folderName: string;
        userPlugin: boolean;
    }>;
}