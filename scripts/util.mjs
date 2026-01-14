// @ts-nocheck
import chalk from "chalk";

export function printBuildSuccess(
    hash,
    branch,
    timeTook,
    minified
) {
    console.info([
        chalk.bold.cyan("✔ Built bundle" + (minified ? " (minified)" : "")),
        hash && chalk.bold.blueBright(`(${hash})`),
        !branch && chalk.bold.cyanBright("(local)"),
        timeTook && chalk.gray(`in ${timeTook.toFixed(3)}ms`)
    ].filter(Boolean).join(" "));
}

export function printBytecodeBuildSuccess(
    hash,
    hbcVersion,
    timeTook
) {
    console.info([
        chalk.bold.cyan("✔ Built bytecode" ),
        hash && chalk.bold.blueBright(`(${hash})`),
        hbcVersion && chalk.bold.cyanBright(`(v${hbcVersion})`),
        timeTook && chalk.gray(`in ${timeTook.toFixed(3)}ms`)
    ].filter(Boolean).join(" "));
}
