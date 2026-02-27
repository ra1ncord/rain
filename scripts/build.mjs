// @ts-nocheck
/* eslint-disable no-restricted-syntax */
import swc from "@swc/core";
import { execSync } from "child_process";
import crypto from "crypto";
import { build } from "esbuild";
import globalPlugin from "esbuild-plugin-globals";
import path from "path";
import { fileURLToPath } from "url";
import yargs from "yargs-parser";
import fs from "fs/promises";

import { printBuildSuccess, printBytecodeBuildSuccess } from "./util.mjs";
import { pluginsImporterPlugin } from "./build/plugins/plugins-importer.mjs";

/** @type string[] */
const metroDeps = await (async () => {
    const ast = await swc.parseFile(path.resolve("./shims/depsModule.ts"));
    return ast.body.at(-1).expression.right.properties.map(p => p.key.value);
})();

const args = yargs(process.argv.slice(2));
const {
    "release-branch": releaseBranch,
    "build-minify": buildMinify,
    "dev": dev,
    "build-bytecode": buildBytecode
} = args;

let context = null;

/** @type {import("esbuild").BuildOptions} */
const config = {
    entryPoints: ["src/entry.ts"],
    bundle: true,
    outfile: "dist/rain.js",
    format: "iife",
    splitting: false,
    external: [],
    supported: {
        // Hermes does not actually support const and let, even though it syntactically
        // accepts it, but it's treated just like 'var' and causes issues
        "const-and-let": false
    },
    footer: {
        js: "//# sourceURL=rain"
    },
    loader: {
        ".png": "dataurl",
        ".html": "text"
    },
    define: {
        window: "globalThis",
        __DEV__: JSON.stringify(releaseBranch !== "main")
    },
    inject: ["./shims/asyncIteratorSymbol.js", "./shims/promiseAllSettled.js"],
    legalComments: "none",
    alias: {
        "!rain-deps-shim!": "./shims/depsModule.ts",
        "sublimation": "./node_modules/sublimation",
        "react/jsx-runtime": "./shims/jsxRuntime"
    },
    plugins: [
        pluginsImporterPlugin(),
        globalPlugin({
            ...metroDeps.reduce((obj, key) => {
                obj[key] = `require("!rain-deps-shim!")[${JSON.stringify(key)}]`;
                return obj;
            }, {})
        }),
        {
            name: "swc",
            setup(build) {
                build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async args => {
                    const result = await swc.transformFile(args.path, {
                        jsc: {
                            externalHelpers: true,
                            transform: {
                                constModules: {
                                    globals: {
                                        "rain-build-info": {
                                            version: `"v0.7.0"`
                                        }
                                    }
                                },
                                react: {
                                    runtime: "automatic"
                                }
                            },
                        },
                        // https://github.com/facebook/hermes/blob/3815fec63d1a6667ca3195160d6e12fee6a0d8d5/doc/Features.md
                        // https://github.com/facebook/hermes/issues/696#issuecomment-1396235791
                        env: {
                            targets: "fully supports es6",
                            include: [
                                "transform-block-scoping",
                                "transform-classes",
                                "transform-async-to-generator",
                                "transform-async-generator-functions"
                            ],
                            exclude: [
                                "transform-parameters",
                                "transform-template-literals",
                                "transform-exponentiation-operator",
                                "transform-named-capturing-groups-regex",
                                "transform-nullish-coalescing-operator",
                                "transform-object-rest-spread",
                                "transform-optional-chaining",
                                "transform-logical-assignment-operators"
                            ]
                        },
                    });

                    return { contents: result.code };
                });
            }
        }
    ]
};

function findHermescPath() {
    const possiblePaths = [
        "node_modules/hermes-compiler/hermesc/linux64-bin/hermesc",
        "node_modules/hermes-compiler/hermesc/win64-bin/hermesc.exe",
        "node_modules/hermes-compiler/hermesc/osx-bin/hermesc",
        "hermesc"
    ];
    
    for (const hermescPath of possiblePaths) {
        try {
            execSync(`${hermescPath} --version`, { stdio: "pipe" });
            return hermescPath;
        } catch {
            continue;
        }
    }
    
    return null;
}

export async function getHermesBytecodeVersion() {
    const hermescPath = findHermescPath();
    
    if (!hermescPath) {
        console.warn("hermesc not found, skipping bytecode compilation");
        return 0;
    }
    
    try {
        const output = execSync(`${hermescPath} --version`, { encoding: "utf-8" });
        const match = output.match(/Bytecode version:\s*(\d+)/i);
        if (match) {
            return parseInt(match[1], 10);
        }
    } catch (error) {
        console.warn("Error getting hermesc version:", error.message);
        return 0;
    }
}

async function compileWithHermesc(inputPath, outputPath, options = {}) {
    const hermescPath = findHermescPath();
    
    if (!hermescPath) {
        console.error("hermesc not found");
        return false;
    }
    
    // i basically just searched up the best hermes compilation flags :P
    const flags = options.flags || [
        "-O",
        "-g0",
        "-finline",
        "-fstatic-require",
        "-strict",
        "-reuse-prop-cache",
        "-optimized-eval",
        "-emit-async-break-check",
        "-block-scoping"
    ];

    // -emit-binary and -out are here to stop idiots like me removing them :P
    const cmd = `${hermescPath} ${flags.join(" ")} -emit-binary -out ${outputPath} ${inputPath}`;
    
    try {
        execSync(cmd, { encoding: "utf-8", stdio: "ignore", maxBuffer: 50 * 1024 * 1024 });
        return true;
    } catch (error) {
        console.error(`Failed to compile bytecode: ${error.message}`);
        return false;
    }
}

// make big ints actually work :P
// bit of a stupid approach, but it works
async function transformBigIntLiterals(jsPath) {
    let code = await fs.readFile(jsPath, "utf-8");
    
    code = code.replace(/([=:(\[,\s])(\d+)n\b/g, '$1BigInt("$2")');
    
    await fs.writeFile(jsPath, code, "utf-8");
}

export async function compileToBytecode(jsPath, customOutputPath = null) {
    const startTime = performance.now();
    const hbcVersion = await getHermesBytecodeVersion();
    
    if (hbcVersion <= 0) {
        console.log("Skipping bytecode compilation (hermesc not available)");
        return null;
    }

    const hbcPath = customOutputPath || jsPath.replace(/\.js$/, `.${hbcVersion}.hbc`);
    
    const tempPath = jsPath.replace(/\.js$/, `.temp.js`);
    await fs.copyFile(jsPath, tempPath);
    
    try {
        await transformBigIntLiterals(tempPath);
        
        const success = await compileWithHermesc(tempPath, hbcPath);
        
        if (success) {
            var timeTook = performance.now() - startTime;
            
            const jsStats = await fs.stat(jsPath);
            const hbcStats = await fs.stat(hbcPath);
            const reduction = ((1 - hbcStats.size / jsStats.size) * 100).toFixed(1);
            
            return hbcPath;
        }
        
        return null;
    } finally {
        try {
            await fs.unlink(tempPath);
        } catch {}
    }
}

export async function buildBundle(overrideConfig = {}) {
    context = {
        hash: releaseBranch ? execSync("git rev-parse --short HEAD").toString().trim() : crypto.randomBytes(8).toString("hex").slice(0, 7)
    };

    const initialStartTime = performance.now();
    await build({ ...config, ...overrideConfig });

    return {
        config,
        context,
        timeTook: performance.now() - initialStartTime
    };
}

const pathToThisFile = path.resolve(fileURLToPath(import.meta.url));
const pathPassedToNode = path.resolve(process.argv[1]);
const isThisFileBeingRunViaCLI = pathToThisFile.includes(pathPassedToNode);

if (isThisFileBeingRunViaCLI) {
    const availablePaths = [];
    const hash = crypto.createHash("sha256");

    const { timeTook } = await buildBundle();
    printBuildSuccess(context.hash, releaseBranch, timeTook);
    
    availablePaths.push(config.outfile);
    const jsContent = await fs.readFile(config.outfile, "utf-8");
    hash.update(jsContent);

    if (buildBytecode) {
        const minOutfileForBytecode = config.outfile.replace(/\.js$/, ".min.js");
        await buildBundle({
            minify: true,
            outfile: minOutfileForBytecode
        });
        
        const hbcVersion = await getHermesBytecodeVersion();
        const hbcPath = config.outfile.replace(/\.js$/, `.${hbcVersion}.hbc`);
        
        const startTime = performance.now();
        const bytecodePath = await compileToBytecode(minOutfileForBytecode, hbcPath);
        const hbcTimeTook = performance.now() - startTime;

        if (bytecodePath) {
            availablePaths.push(bytecodePath);
            const hbcContent = await fs.readFile(bytecodePath);
            hash.update(hbcContent);
        }

        printBytecodeBuildSuccess(context.hash, hbcVersion, hbcTimeTook);
        
        await fs.unlink(minOutfileForBytecode);
    }

    if (buildMinify) {
        const minOutfile = config.outfile.replace(/\.js$/, ".min.js");
        const { timeTook: minTimeTook } = await buildBundle({
            minify: true,
            outfile: minOutfile
        });

        printBuildSuccess(context.hash, releaseBranch, minTimeTook, true);
        
        availablePaths.push(minOutfile);
        const minJsContent = await fs.readFile(minOutfile, "utf-8");
        hash.update(minJsContent);

        if (buildBytecode) {
            const minBytecodePath = await compileToBytecode(minOutfile);
            if (minBytecodePath) {
                availablePaths.push(minBytecodePath);
                const minHbcContent = await fs.readFile(minBytecodePath);
                hash.update(minHbcContent);
            }
        }
    }

    const infoPath = "dist/info.json";
    const packageJson = JSON.parse(await fs.readFile("./package.json", "utf-8"));
    
    const hbcVersion = await getHermesBytecodeVersion();
    
    await fs.writeFile(
        infoPath,
        JSON.stringify(
            {
                paths: availablePaths,
                version: packageJson.version,
                hash: hash.digest("hex"),
                revision: context.hash,
                hermesBytecodeVersion: hbcVersion > 0 ? hbcVersion : null
            },
            null,
            2
        )
    );
    
    console.log(`\nAvailable paths: ${availablePaths.join(", ")}`);
    console.log(`Info file written to ${infoPath}`);
}