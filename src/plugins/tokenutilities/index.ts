/* eslint-disable indent */
import { findAssetId } from "@api/assets";
import { registerCommand } from "@api/commands";
import {
  ApplicationCommandOptionType,
  RainApplicationCommand,
} from "@api/commands/types";
import { showToast } from "@api/ui/toasts";
import { findByProps, findByPropsLazy, findByStoreName } from "@metro";
import { clipboard } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";
const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");
const { getToken } = findByProps("getToken");
const UserStore = findByStoreName("UserStore");
var unregisters: any;

export default definePlugin({
  name: "Token Utilities",
  description: "Get your token",
  author: [Contributors.Axolotl_cpp],
  id: "tokenutilities",
  version: "1.0.0",

  start() {
    unregisters = registerCommand(getTokenCommand());
    unregisters = registerCommand(tokenLoginCommand());
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
