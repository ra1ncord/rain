// ./build/hermes.mjs
import { execSync } from "child_process";
import path from "path";
import { existsSync } from "fs";

/**
 * Gets the platform-specific path to the hermesc binary.
 * Assumes 'react-native' is installed in node_modules.
 * @returns {string} The full path to the hermesc binary.
 */
function getHermescBinaryPath() {
    const paths = {
        win32: "win64-bin/hermesc.exe",
        darwin: "osx-bin/hermesc",
        linux: "linux64-bin/hermesc",
    };

    if (!(process.platform in paths)) {
        throw new Error(`Unsupported platform for hermesc: ${process.platform}`);
    }

    const sdksDir = path.resolve("./node_modules/react-native/sdks");
    const binPath = path.join(sdksDir, "hermesc", paths[process.platform]);

    if (!existsSync(binPath)) {
        throw new Error(`Hermes compiler not found at ${binPath}. Ensure 'react-native' is installed.`);
    }

    // On Unix-like systems, ensure it's executable
    if (process.platform !== "win32") {
        execSync(`chmod +x ${binPath}`);
    }

    return binPath;
}

/**
 * Compiles a JavaScript file to Hermes Bytecode (.hbc) using hermesc,
 * optimized for speed.
 * @param {string} inputPath Path to the input JavaScript bundle.
 * @param {string} outputPath Path for the resulting .hbc file.
 * @param {boolean} isMinifiedBuild Should apply release-level optimization flags.
 */
export function compileToHermesBytecode(inputPath, outputPath, isMinifiedBuild = false) {
    const binPath = getHermescBinaryPath();
    
    // Use -O for aggressive optimization (speed) and -g0 for no debug info.
    // -O is generally the fastest for final execution.
    const optimizationFlag = "-O";
    const debugFlag = "-g0"; 

    // The -out flag is corrected from the previous implementation's -output.
    const command = [
        binPath,
        "-emit-binary",
        optimizationFlag,
        debugFlag,
        "-out", outputPath, // 👈 FIX: Changed -output to -out
        inputPath,
    ].join(" ");

    try {
        console.log(`\nCompiling to Hermes Bytecode: ${outputPath}`);
        execSync(command, { stdio: "inherit" });
        console.log("Hermes Bytecode compilation complete.");
    } catch (error) {
        console.error("Hermes Bytecode compilation failed.");
        throw error;
    }
}