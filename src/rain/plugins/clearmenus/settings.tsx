import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { NavigationNative } from "@metro/common";
import { findByProps } from "@metro";
import { StyleSheet, View, Image } from "react-native";
import MoreCommandsText from "../morecommands/settings/components/Text";
import AccountSettingsPage from "./settings/pages/AccountSettingsPage";
import BillingSettingsPage from "./settings/pages/BillingSettingsPage";
import AppSettingsPage from "./settings/pages/AppSettingsPage";
import SupportSettingsPage from "./settings/pages/SupportSettingsPage";
import WhatsNewSettingsPage from "./settings/pages/WhatsNewSettingsPage";
import DeveloperSettingsPage from "./settings/pages/DeveloperSettingsPage";
import BuildStatusSettingsPage from "./settings/pages/BuildStatusSettingsPage";
import StaffSettingsPage from "./settings/pages/StaffSettingsPage";
import ManageButtonsPage from "./settings/pages/ManageButtonsPage";

const { ScrollView } = findByProps("ScrollView");
const { TableRow, TableRowGroup, Stack } = findByProps(
  "TableSwitchRow",
  "TableRow",
  "TableRowGroup",
  "Stack"
);


export default function Settings() {
  const navigation = NavigationNative.useNavigation();
  const categories = [
    { key: "account", label: "Account", icon: "UserIcon", render: AccountSettingsPage },
    { key: "billing", label: "Billing", icon: "CreditCardIcon", render: BillingSettingsPage },
    { key: "appSettings", label: "App", icon: "SettingsIcon", render: AppSettingsPage },
    { key: "support", label: "Support", icon: "CircleQuestionIcon", render: SupportSettingsPage },
    { key: "whatsNew", label: "What's New", icon: "CircleInformationIcon", render: WhatsNewSettingsPage },
    { key: "developerSettings", label: "Developer", icon: "WrenchIcon", render: DeveloperSettingsPage },
    { key: "buildStatus", label: "Build", icon: "RefreshIcon", render: BuildStatusSettingsPage },
    { key: "staffSettings", label: "Staff", icon: "StaffBadgeIcon", render: StaffSettingsPage },
  ];

  // User header logic
  const users = findByProps("getUser", "getCurrentUser");
  const currentUser = users?.getCurrentUser?.();
  const { getUserAvatarURL } = findByProps("getUserAvatarURL") || {};
  const { getDefaultAvatarURL } = findByProps("getDefaultAvatarURL") || {};
  let avatarUrl = null;
  if (currentUser) {
    const hasAnimatedAvatar = currentUser.avatar?.startsWith("a_");
    if (getUserAvatarURL && currentUser.avatar) {
      avatarUrl = getUserAvatarURL(currentUser, hasAnimatedAvatar);
    } else if (getDefaultAvatarURL) {
      avatarUrl = getDefaultAvatarURL(currentUser);
    } else if (currentUser.avatar) {
      const isGif = currentUser.avatar.startsWith("a_");
      avatarUrl = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.${isGif ? "gif" : "png"}?size=128`;
    } else {
      const defaultAvatarIndex = currentUser.discriminator
        ? parseInt(currentUser.discriminator) % 5
        : (parseInt(currentUser.id) >> 22) % 6;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    }
  }

  const styles = StyleSheet.create({
    header: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      paddingHorizontal: 12,
    },
    avatarWrapper: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: "#232428",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "#36373b",
      marginBottom: 12,
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
  });

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          {avatarUrl && (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
          )}
        </View>
        <View style={styles.textContainer}>
          <MoreCommandsText variant="display-md" color="TEXT_DEFAULT" align="center">
            ClearMenus
          </MoreCommandsText>
          <MoreCommandsText
            variant="text-md/bold"
            color="TEXT_MUTED"
            align="center"
            style={{ marginTop: 4 }}
          >
            Hide unwanted buttons and settings
          </MoreCommandsText>
        </View>
      </View>
      <Stack spacing={8} style={{ padding: 10 }}>
        <TableRowGroup title="Message Action Sheet">
          <TableRow
            key="manageButtons"
            label="Manage Buttons"
            trailing={<TableRow.Arrow />}
            onPress={() => navigation.push("RAIN_CUSTOM_PAGE", { title: "Manage Buttons", render: ManageButtonsPage })}
          />
        </TableRowGroup>
        <TableRowGroup title="Settings Categories">
          {categories.map(cat => (
            <TableRow
              key={cat.key}
              label={cat.label}
              icon={<TableRow.Icon source={findAssetId(cat.icon)} />}
              trailing={<TableRow.Arrow />}
              onPress={() => navigation.push("RAIN_CUSTOM_PAGE", { title: cat.label, render: cat.render })}
            />
          ))}
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}
