// build.mjs
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

import { printBuildSuccess } from "./util.mjs";
import { pluginsImporterPlugin } from "./build/plugins/plugins-importer.mjs";
import { compileToHermesBytecode } from "./build/hermes.mjs"; 

/** @type string[] */
// ... (metroDeps calculation remains the same)
const metroDeps = await (async () => {
    const ast = await swc.parseFile(path.resolve("./shims/depsModule.ts"));
    return ast.body.at(-1).expression.right.properties.map(p => p.key.value);
})();

const args = yargs(process.argv.slice(2));
const {
    "release-branch": releaseBranch,
    "build-minify": buildMinify,
    "dev": dev,
    "build-bytecode": globalBuildBytecode // Rename to avoid conflict later
} = args;

let context = null;

/** @type {import("esbuild").BuildOptions} */
const config = {
    // ... (Your config remains the same)
    entryPoints: ["src/entry.ts"],
    bundle: true,
    outfile: "dist/rain.js",
    format: "iife",
    splitting: false,
    external: [],
    supported: {
        "const-and-let": false
    },
    footer: {
        js: "//# sourceURL=rain"
    },
    loader: {
        ".png": "dataurl"
    },
    define: {
        window: "globalThis",
        __DEV__: JSON.stringify(releaseBranch !== "main")
    },
    inject: ["./shims/asyncIteratorSymbol.js", "./shims/promiseAllSettled.js"],
    legalComments: "none",
    alias: {
        "!kettu-deps-shim!": "./shims/depsModule.ts",
        "spitroast": "./node_modules/spitroast",
        "react/jsx-runtime": "./shims/jsxRuntime"
    },
    plugins: [
        pluginsImporterPlugin(),
        globalPlugin({
            ...metroDeps.reduce((obj, key) => {
                obj[key] = `require("!kettu-deps-shim!")[${JSON.stringify(key)}]`;
                return obj;
            }, {})
        }),
        // ... (swc plugin remains the same)
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
                                            version: `"v0.1.0"`
                                        },
                                        "bunny-build-info": {
                                            version: `"v1.3.7"`
                                        }
                                    }
                                },
                                react: {
                                    runtime: "automatic"
                                }
                            },
                        },
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

export async function buildBundle(overrideConfig = {}) {
    context = {
        hash: releaseBranch ? execSync("git rev-parse --short HEAD").toString().trim() : crypto.randomBytes(8).toString("hex").slice(0, 7)
    };

    // 1. Separate custom flags from esbuild options
    const { "build-bytecode": buildBytecode, ...esbuildOptions } = overrideConfig; // 👈 THE FIX

    const isMinifiedBuild = !!overrideConfig.minify;
    const initialStartTime = performance.now();
    
    // 2. Pass only the clean esbuild options to the build function
    await build({ ...config, ...esbuildOptions }); // 👈 Pass clean options
    
    // 3. Use the separated custom flag for conditional logic
    if (buildBytecode || globalBuildBytecode) {
        const inputFile = esbuildOptions.outfile || config.outfile;
        const outputFile = inputFile.replace(/\.js$/, ".bundle");
        
        compileToHermesBytecode(inputFile, outputFile, isMinifiedBuild); 
    }

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
    // Standard build
    const { timeTook } = await buildBundle({ "build-bytecode": globalBuildBytecode }); // Pass the global flag here too for consistency

    printBuildSuccess(
        context.hash,
        releaseBranch,
        timeTook
    );

    // Minified build
    if (buildMinify) {
        const minifiedOutfile = config.outfile.replace(/\.js$/, ".min.js");
        const { timeTook } = await buildBundle({
            minify: true,
            outfile: minifiedOutfile,
            "build-bytecode": globalBuildBytecode // Pass the global flag here too
        });

        printBuildSuccess(
            context.hash,
            releaseBranch,
            timeTook,
            true
        );
    }
}