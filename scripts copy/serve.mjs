// @ts-nocheck
import chalk from "chalk";
import { readFile } from "fs/promises";
import http from "http";
import os from "os";
import url from "url";
import yargs from "yargs-parser";

import { buildBundle } from "./build.mjs";
import { printBuildSuccess } from "./util.mjs";

const args = yargs(process.argv.slice(2));

export function serve(options) {
    // @ts-ignore
    const server = http.createServer(async (req, res) => {
        const { pathname } = url.parse(req.url || "", true);
        
        let shouldBuildBytecode = false;
        let responseFileExtension = null;
        let mimeType = null;
        
        // 1. Determine the request type and set flags/MIME type
        if (pathname?.endsWith(".hbc")) {
            shouldBuildBytecode = true;
            responseFileExtension = ".hbc";
            mimeType = "application/vnd.hermes-bytecode";
        } else if (pathname?.endsWith(".js")) {
            responseFileExtension = ".js";
            mimeType = "application/javascript";
        }

        if (responseFileExtension) {
            try {
                const isMinified = args["build-minify"];
                
                // --- ⬇️ CRITICAL FIX: The esbuild output MUST be the .js file ⬇️
                const esbuildOutfile = "dist/rain" + (isMinified ? ".min" : "") + ".js";
                
                const buildFlags = {
                    outfile: esbuildOutfile, // Always tell esbuild to output the .js file
                    minify: isMinified,
                    "build-bytecode": shouldBuildBytecode 
                };
                // --- ⬆️ CRITICAL FIX ⬆️

                // 3. Build the bundle (and potentially the bytecode)
                const { context, timeTook } = await buildBundle(buildFlags);

                printBuildSuccess(
                    context.hash,
                    args.production,
                    timeTook,
                    isMinified
                );
                
                // 4. Determine the file to send in the HTTP response
                let fileToServePath = esbuildOutfile;
                if (shouldBuildBytecode) {
                    // If bytecode was requested, the path is the .hbc file
                    fileToServePath = esbuildOutfile.replace(/\.js$/, ".hbc");
                }
                
                // 5. Serve the requested file
                res.writeHead(200, { "Content-Type": mimeType });
                res.end(await readFile(fileToServePath, "utf-8"));
                
            } catch (e) {
                console.error(chalk.red("Build/Serve Error:"), e); // Log the full error object
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end(`Build or compilation failed: ${e.message}`);
            }
        } else {
            // Only serve .js and .hbc files, otherwise 404
            res.writeHead(404);
            res.end();
        }
    }, options);

    // ... (rest of the serve function remains the same)
    server.listen(args.port ?? 4040);

    console.info(chalk.bold.blueBright("Its raining on:"));

    const netInterfaces = os.networkInterfaces();
    for (const netinterfaces of Object.values(netInterfaces)) {
        for (const details of netinterfaces || []) {
            if (details.family !== "IPv4") continue;
            const port = chalk.green(server.address()?.port.toString());
            
            console.info(`  http://${details.address}:${port}/rain.js`);
            console.info(`  http://${details.address}:${port}/rain.hbc`);
        }
    }

    return server;
}

const server = serve();

console.log("\nPress Q key or Ctrl+C to exit.");