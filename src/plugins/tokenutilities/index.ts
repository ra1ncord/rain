/* eslint-disable indent */
import { findAssetId } from "@api/assets";
import { registerCommand } from "@api/commands";
import {
  ApplicationCommandOptionType,
  RainApplicationCommand,
} from "@api/commands/types";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { clipboard } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

import { tokenUtilitiesSettings, useTokenUtilitiesSettings } from "./storage";

const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");
const { getToken } = findByProps("getToken");

var unregisters: any;

export default definePlugin({
  name: "Token Utilities",
  description: "Get your account token or login with a token",
  author: [Contributors.Axolotl_cpp],
  id: "tokenutilities",
  version: "1.0.0",

  async start() {
    const hasConfirmed = tokenUtilitiesSettings.takenResponsability !== false;
    if (!hasConfirmed) {
      const confirmed = await new Promise<boolean>(resolve => {
        showConfirmationAlert({
          title: "WARNING!!!!",
          content:
            "Enabling token utilities has it's own risks.\n**Do not share your token with anyone, doing so will give unrestricted access to your account to them.**\nRain dev team and contributors do not bear any responsibility for any issues faced when using the plugin, including security risks and possible account termination.\n**Use at your own risk**\n",
          confirmText: "I understand",
          confirmColor: "red",
          onConfirm: () => {
            resolve(true);
          },
          cancelText: "Cancel",
          onCancel: () => {
            resolve(false);
          },
        });
      });

      if (!confirmed) {
        throw new Error("User aborted");
      }
      useTokenUtilitiesSettings.setState({ takenResponsability: true });
      unregisters = registerCommand(getTokenCommand());
      unregisters = registerCommand(tokenLoginCommand());
    }
  },
  stop() {
    unregisters?.();
  },
});

const showTokenSheet = (token: string) => {
  showSimpleActionSheet({
    key: "TokenDisplay",
    header: {
      title: "Your Token",
      onClose: () => hideActionSheet(),
    },
    options: [
      {
        icon: findAssetId("ClipboardListIcon"),
        label: "Copy Token",
        onPress: () => {
          clipboard.setString(token);
          showToast("Token copied!", findAssetId("ClipboardCheckIcon"));
        },
      },
    ],
  });
};

const getTokenCommand = (): RainApplicationCommand => ({
  name: "get token",
  displayName: "get token",
  description: "Get your account token",
  displayDescription: "Get your account token",
  applicationId: "-1",
  inputType: 1,
  type: 1,
  shouldHide: () => false,
  execute: async (args, ctx) => {
    try {
      const token = getToken();
      if (token) {
        showTokenSheet(token);
      } else {
        showToast("Couldn't get token", findAssetId("WarningIcon"));
      }
    } catch (error) {
      console.error("[TokenUtilities] Error:", error);
      showToast("Failed to get token", findAssetId("WarningIcon"));
    }
  },
});

const tokenLoginCommand = (): RainApplicationCommand => ({
  name: "token login",
  description: "Login with your token",
  applicationId: "-1",
  inputType: 1,
  type: 1,
  shouldHide: () => false,
  options: [
    {
      name: "token",
      description: "The token you want to use",
      type: ApplicationCommandOptionType.STRING,
      required: true,
    },
  ],
  execute: async (args, ctx) => {
    const token = args[0].value;
    try {
      if (token) {
        await findByProps(
          "login",
          "logout",
          "switchAccountToken",
        ).switchAccountToken(token);
      } else {
        showToast("Couldn't log in", findAssetId("WarningIcon"));
      }
      showToast("Succesfully logged in");
    } catch (error) {
      console.error("[TokenUtilities] Error:", error);
      showToast("Failed to log in", findAssetId("WarningIcon"));
    }
  },
});
