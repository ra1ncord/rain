import { findByProps } from "@metro";
import { getDebugInfo } from "@api/debug";
import { ReactNative } from "@metro/common";
import { storage } from "../../storage";

const MessageActions = findByProps("sendMessage");
const messageUtil = findByProps(
  "sendBotMessage",
  "sendMessage",
  "receiveMessage",
);

// Device info helper
function getDeviceInfo() {
  let { height, width, scale } = ReactNative.Dimensions.get("screen");
  height *= scale;
  width *= scale;
  return { width, height };
}

// Get current UTC date and time
function getCurrentUTCDateTime() {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

    const year = utc.getFullYear();
    const month = String(utc.getMonth() + 1).padStart(2, "0");
    const day = String(utc.getDate()).padStart(2, "0");
    const hours = String(utc.getHours()).padStart(2, "0");
    const minutes = String(utc.getMinutes()).padStart(2, "0");
    const seconds = String(utc.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return "Unknown";
  }
}

// Hardware info helper
function getHardwareInfo() {
  try {
    const hwProps = findByProps("memory");
    if (!hwProps)
      return { cpuCoreCount: "N/A", cpuPerc: "N/A", memUsage: "N/A" };

    const { cpuCoreCount, cpuPercentage, memory } = hwProps;
    const cpuPerc = cpuPercentage ? cpuPercentage.toFixed(2) + "%" : "N/A";
    const memUsage = memory
      ? parseFloat((memory / 1000).toPrecision(3)) + " MB"
      : "N/A";

    return { cpuCoreCount, cpuPerc, memUsage };
  } catch (e) {
    console.warn("Hardware info unavailable:", e);
    return { cpuCoreCount: "N/A", cpuPerc: "N/A", memUsage: "N/A" };
  }
}

// Discord info helper
function getDiscordInfo() {
  try {
    const { NativeModules } = ReactNative;
    const discordInfo =
      NativeModules.InfoDictionaryManager ?? NativeModules.RTNClientInfoManager;
    return discordInfo || {};
  } catch (e) {
    console.warn("Discord info unavailable:", e);
    return {};
  }
}

// Generate system info
function generateSystemInfo() {
  try {
    const { cpuCoreCount, cpuPerc, memUsage } = getHardwareInfo();
    const discordInfo = getDiscordInfo();
    const _debugInfo =
      (typeof getDebugInfo === "function" ? (getDebugInfo() as any) : {}) || {};
    const { rain, discord, react, hermes, os, device } = _debugInfo;
    const utcDateTime = getCurrentUTCDateTime();

    const { version: HermesRelease, bytecodeVersion: HermesBytecode } =
      hermes || {};
    const { version: ReactVersion, nativeVersion: RNVersion } = react || {};
    const { name: osName, version: osVersion, sdk: osSdk } = os || {};
    const {
      manufacturer: deviceManufacturer,
      brand: deviceBrand,
      model: deviceModel,
      codename: deviceCodename,
    } = device || {};
    const { version: rainVersion } = rain || {};
    const { version: discordVersion, build: discordBuild } = discord || {};

    const deviceName =
      osName == "iOS" ? deviceCodename : `${deviceBrand} ${deviceModel}`;
    const { width, height } = getDeviceInfo();

    const output = {
      Device: {
        Device: deviceName || "Unknown",
        Model: deviceModel || "Unknown",
        Manufacturer: deviceManufacturer || "Unknown",
        Brand: deviceBrand || "Unknown",
        Display: `${width}x${height}`,
      },
      Hardware: {
        "CPU Cores": cpuCoreCount || "N/A",
        "CPU Usage": cpuPerc,
        "Memory Usage": memUsage,
      },
      Software: {
        OS: osName || "Unknown",
        Version: osVersion || "Unknown",
      },
      Discord: {
        Version: discordVersion || "Unknown",
        Build: discordBuild || "Unknown",
        Rain: rainVersion || "Unknown",
      },
      React: {
        Version: ReactVersion || "Unknown",
        "Hermes Bytecode": HermesBytecode || "Unknown",
        Hermes: HermesRelease || "Unknown",
        Native: RNVersion || "Unknown",
      },
      Time: {
        UTC: utcDateTime,
      },
    };

    if (osSdk) {
      (output.Software as any)["SDK Version"] = osSdk;
    }

    return output;
  } catch (e) {
    console.error("Error generating system info:", e);
    throw e;
  }
}

// Initialize storage defaults
const categories = [
  "device",
  "hardware",
  "software",
  "discord",
  "react",
  "time",
  "ephemeral",
];
for (const cat of categories) {
  if ((storage as any)[cat] === undefined) (storage as any)[cat] = true;
}

// Command execution function
function executeSysinfoCommand(args: any[], ctx: any) {
  try {
    const output = ["__System Information__\n"];
    const data = generateSystemInfo();

    Object.keys(data).forEach((option) => {
      const permit = (storage as any)[option.toLowerCase()];
      const slasharg = args.find((i: any) => i.name == option.toLowerCase());
      const slashval = slasharg?.value ?? permit;

      if ((slashval || permit) && !(permit && !slashval)) {
        output.push(`[**${option}**]`);
        Object.keys(data[option as keyof typeof data]).forEach((subOption) => {
          output.push(
            `> ${subOption}: ${(data[option as keyof typeof data] as any)[subOption]}`,
          );
        });
      }
    });

    const epermit = storage["ephemeral"];
    const ephemeral = args.find((i) => i.name == "ephemeral")?.value ?? epermit;

    if ((ephemeral || epermit) && !(epermit && !ephemeral)) {
      messageUtil.sendBotMessage(ctx.channel.id, output.join("\n"));
      return null;
    } else {
      const fixNonce = Date.now().toString();
      MessageActions.sendMessage(
        ctx.channel.id,
        { content: output.join("\n") },
        void 0,
        { nonce: fixNonce },
      );
      return null;
    }
  } catch (e) {
    console.error("[Sysinfo] Error:", e);
    // Silent fail
    return null;
  }
}

export const sysinfoCommand = {
  name: "sysinfo",
  displayName: "sysinfo",
  description: "Display system information",
  displayDescription: "Display system information",
  options: [
    {
      name: "ephemeral",
      displayName: "ephemeral",
      description: "Keep sysinfo ephemeral (default: true)",
      displayDescription: "Keep sysinfo ephemeral (default: true)",
      type: 5,
      required: false,
    },
    ...categories.slice(0, -1).map((cat) => ({
      name: cat,
      displayName: cat,
      description: `Display the ${cat} section. Set default in settings.`,
      displayDescription: `Display the ${cat} section. Set default in settings.`,
      type: 5,
      required: false,
    })),
  ],
  execute: executeSysinfoCommand,
  applicationId: "-1",
  inputType: 1,
  type: 1,
};
