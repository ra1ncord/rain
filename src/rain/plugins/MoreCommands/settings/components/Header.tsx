import { storage } from "../../storage";
import { React, ReactNative as RN } from "@metro/common";
import { findByProps } from "@metro";
import { StyleSheet } from "react-native";
import { semanticColors } from "@api/ui/components/color";
import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import Text from "./Text";

export default function Header() {
  const [clickCounter, setClickCounter] = React.useState(0);
  const [clickTimeout,] = React.useState<NodeJS.Timeout | null>(
    null,
  );
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [isAnimatedAvatar, setIsAnimatedAvatar] = React.useState(false);

  const users = findByProps("getUser", "getCurrentUser");
  const currentUser = users?.getCurrentUser?.();

  const { getUserAvatarURL } = findByProps("getUserAvatarURL") || {};
  const { getDefaultAvatarURL } = findByProps("getDefaultAvatarURL") || {};

  const styles = StyleSheet.create({
    container: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      width: "100%",
    },
    avatarContainer: {
      position: "relative",
      width: 80,
      height: 80,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    avatarWrapper: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: semanticColors.BACKGROUND_SECONDARY,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 2,
      borderColor: semanticColors.BACKGROUND_TERTIARY,
    },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 18,
    },
    textContainer: {
      alignItems: "center",
      justifyContent: "center",
      maxWidth: "90%",
    },
    animatedIndicator: {
      position: "absolute",
      top: 6,
      right: 6,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderRadius: 8,
      width: 16,
      height: 16,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      tintColor: semanticColors.INTERACTIVE_NORMAL,
    },
  });

  React.useEffect(() => {
    if (currentUser) {
      let url;
      let animated = false;
      const hasAnimatedAvatar = currentUser.avatar?.startsWith("a_");

      if (getUserAvatarURL && currentUser.avatar) {
        url = getUserAvatarURL(currentUser, hasAnimatedAvatar);
        animated = hasAnimatedAvatar;
      } else if (getDefaultAvatarURL) {
        url = getDefaultAvatarURL(currentUser);
      } else if (currentUser.avatar) {
        const isGif = currentUser.avatar.startsWith("a_");
        url = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.${isGif ? "gif" : "png"}?size=128`;
        animated = isGif;
      } else {
        const defaultAvatarIndex = currentUser.discriminator
          ? parseInt(currentUser.discriminator) % 5
          : (parseInt(currentUser.id) >> 22) % 6;
        url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
      }

      setAvatarUrl(url);
      setIsAnimatedAvatar(animated);
    }
  }, [currentUser]);

  const handleAvatarPress = () => {
    if (storage.hiddenSettings?.enabled) {
      storage.hiddenSettings.visible = !storage.hiddenSettings.visible;
      showToast(
        `Hidden settings ${storage.hiddenSettings.visible ? "visible" : "hidden"}`,
        findAssetId("SettingsIcon"),
      );
      return;
    }

    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }

    const newCounter = clickCounter + 1;
    setClickCounter(newCounter);

    if (newCounter < 10) {
      return;
    }

    showToast("Hidden settings unlocked!", findAssetId("CheckmarkIcon"));
    storage.hiddenSettings = {
      ...storage.hiddenSettings,
      enabled: true,
      visible: true,
    };
    setClickCounter(0);
  };

  return (
    <RN.View style={styles.container}>
      <RN.View style={styles.avatarContainer}>
        <RN.Pressable onPress={handleAvatarPress}>
          <RN.View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <>
                <RN.Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
                {isAnimatedAvatar && (
                  <RN.View style={styles.animatedIndicator}></RN.View>
                )}
              </>
            ) : (
              <RN.Image
                source={findAssetId("ic_account_circle_24px")}
                style={styles.avatarPlaceholder}
              />
            )}
          </RN.View>
        </RN.Pressable>
      </RN.View>

      <RN.View style={styles.textContainer}>
        <Text variant="display-md" color="TEXT_DEFAULT" align="center">
          More Commands
        </Text>
        <Text
          variant="text-md/bold"
          color="TEXT_MUTED"
          align="center"
          style={{ marginTop: 4 }}
        >
          A collection of useful commands
        </Text>
      </RN.View>
    </RN.View>
  );
}
