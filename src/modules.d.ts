declare module "*.png" {
    const str: string;
    export default str;
}

declare module "#rain-plugins" {
    const plugins: Record<string, import("./rain/plugins/types").rainPlugin>;
    export default plugins;
}

declare module "rain-build-info" {
    const version: string;
}

// bunny compat
declare module "bunny-build-info" {
    const version: string;
}