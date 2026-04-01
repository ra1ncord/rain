/* eslint-disable indent */
import { findAssetId } from "@api/assets";
import { registerCommand } from "@api/commands";
import { RainApplicationCommand } from "@api/commands/types";
import { showToast } from "@api/ui/toasts";
import { findByProps, findByStoreName } from "@metro";
import { clipboard } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

import { useAuthorizationStore } from "./stores/AuthorizationStore";

const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");
const UserStore = findByStoreName("UserStore");
var unregisters: any;

export default definePlugin({
  name: "Token Utilities",
  description: "Get your token",
  author: [
    Contributors.Axolotl_cpp,
    Developers.cocobo1,
    Contributors.LampDelivery,
    Contributors.nexpid,
  ],
  id: "tokenutilities",
  version: "1.0.0",

  start() {
    unregisters = registerCommand(getTokenCommand());
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
      const auth = useAuthorizationStore.getState();
      const userId = UserStore.getCurrentUser()?.id;
      const token = userId ? auth.tokens[userId] : undefined;

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
