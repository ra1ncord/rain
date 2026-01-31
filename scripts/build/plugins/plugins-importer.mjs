import { readdir, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");
const pluginsDirectoryPath = path.join(projectRoot, "src/rain/plugins");

// @ts-ignore
async function gatherPlugins(plugins = [], dir = pluginsDirectoryPath, relativePath = "") {
    try {
        const pluginDirs = await readdir(dir, { recursive: false });
        
        for (const pluginDir of pluginDirs) {
            const pluginPath = path.join(dir, pluginDir);
            const stats = await stat(pluginPath);
            
            if (stats.isDirectory()) {
                const baseName = path.basename(pluginDir);
                const newRelativePath = relativePath ? `${relativePath}/${pluginDir}` : pluginDir;
                
                if (baseName.startsWith("_") || baseName.startsWith(".")) {
                    await gatherPlugins(plugins, pluginPath, newRelativePath);
                } else {
                    const pluginId = newRelativePath
                        .split("/")
                        .map(segment => segment.replace(/^[._]/, ""))
                        .filter(segment => segment)
                        .join(".");
                    
                    plugins.push({
                        id: pluginId,
                        relativePath: newRelativePath,
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error gathering plugins:", error);
    }
    
    return plugins;
}

async function makeModule() {
    const plugins = await gatherPlugins();
    
    if (plugins.length === 0) {
        console.warn("Warning: No plugins found in", pluginsDirectoryPath);
        return "export default {};";
    }
    
    const pluginImports = plugins.map(({ id, relativePath }) => {
        const importPath = `./plugins/${relativePath}`;
        return `    "${id}": (() => {
        try {
            return require("${importPath}").default;
        } catch (error) {
            console.error("[Failed to compile '${id}' from '${importPath}':", error.message);
            return null;
        }
    })()`;
    });
    
    return `
// Auto-generated plugin imports
export default {
${pluginImports.join(",\n")}
};
    `.trim();
}

export function pluginsImporterPlugin() {
    return {
        name: "rain-plugins-importer",
        //@ts-ignore
        setup(build) {
            //@ts-ignore
            build.onResolve({ filter: /^#rain-plugins$/ }, args => {
                return {
                    path: path.join(projectRoot, "src/rain/plugins"),
                    namespace: "rain-plugins-importer",
                };
            });
            
            build.onLoad({ filter: /.*/, namespace: "rain-plugins-importer" }, async () => {
                return {
                    contents: await makeModule(),
                    loader: "ts",
                    resolveDir: path.join(projectRoot, "src/rain"),
                };
            });
        },
    };
}