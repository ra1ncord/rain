// @ts-nocheck
import chalk from "chalk";
import { readFile } from "fs/promises";
import http from "http";
import os from "os";
import readline from "readline";
import url from "url";
import yargs from "yargs-parser";
import { buildBundle, getHermesBytecodeVersion, compileToBytecode } from "./build.mjs";
import { printBuildSuccess, printBytecodeBuildSuccess } from "./util.mjs";

const args = yargs(process.argv.slice(2));

export async function serve(options) {
    const hbcVersion = await getHermesBytecodeVersion();

    const server = http.createServer(async (req, res) => {
        const { pathname } = url.parse(req.url || "", true);

        if (pathname?.endsWith(".js") || pathname?.endsWith(".hbc")) {
            try {
                const { config, context, timeTook } = await buildBundle();
                printBuildSuccess(
                    context.hash,
                    args.production,
                    timeTook
                );

                let filePath;
                let contentType;

                if (pathname?.endsWith(".hbc")) {
                    const minOutfileForBytecode = config.outfile.replace(/\.js$/, ".min.js");
                    await buildBundle({
                        minify: true,
                        outfile: minOutfileForBytecode
                    });
                    
                    const hbcPath = config.outfile.replace(/\.js$/, `.${hbcVersion}.hbc`);
                    
                    const hbcStartTime = performance.now();
                    const bytecodePath = await compileToBytecode(minOutfileForBytecode, hbcPath);
                    const hbcTimeTook = performance.now() - hbcStartTime;

                    if (!bytecodePath) {
                        throw new Error("Failed to compile bytecode");
                    }

                    filePath = bytecodePath;
                    contentType = "application/octet-stream";

                    printBytecodeBuildSuccess(
                        context.hash,
                        hbcVersion,
                        hbcTimeTook
                    );
                } else {
                    filePath = config.outfile;
                    contentType = "application/javascript";
                }

                res.writeHead(200, { "Content-Type": contentType });
                res.end(await readFile(filePath));
            } catch (error) {
                console.error(chalk.red`Error: ${error.message}`);
                res.writeHead(500);
                res.end();
            }
        } else {
            res.writeHead(404);
            res.end();
        }
    }, options);

    server.listen(args.port ?? 4040);
    console.info(chalk.bold.blueBright("Its raining on:"));

    const netInterfaces = os.networkInterfaces();
    for (const netinterfaces of Object.values(netInterfaces)) {
        for (const details of netinterfaces || []) {
            if (details.family !== "IPv4") continue;
            const port = chalk.green(server.address()?.port.toString());
            console.info(`  http://${details.address}:${port}/rain.js`);
            if (hbcVersion) {
                console.info(`  http://${details.address}:${port}/rain.${hbcVersion}.hbc`);
            }
        }
    }

    return server;
}

const server = await serve();
console.log("\nPress Q key or Ctrl+C to exit.");