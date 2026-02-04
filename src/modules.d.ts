declare module "*.png" {
    const str: string;
    export default str;
}

declare module "*.html" {
    const html: string;
    export default html;
}

declare module "#rain-plugins" {
    const plugins: Record<string, import("./rain/plugins/types").rainPlugin>;
    export default plugins;
}

declare module "rain-build-info" {
    const version: string;
}
