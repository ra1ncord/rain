declare module "*.png" {
    const str: string;
    export default str;
}

declare module "#rain-plugins" {
    const plugins: Record<string, import("./rain/plugins/types").rainPlugin>;
    export default plugins;
}