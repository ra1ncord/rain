import { hideSheet } from "@ui/sheets";
import { ActionSheet, Card, IconButton, Text } from "@metro/common/components";
import { clipboard } from "@metro/common";
import { purgeStorage } from "@lib/api/storage";
import { findAssetId } from "@lib/api/assets";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import TitleComponent from "./TitleComponent";
import { PluginInfoActionSheetProps } from "./common";
import { semanticColors } from "@ui/components/color";

function PluginInfoIconButton(props) {
  const { onPress } = props;
  props.onPress &&= () => {
    hideSheet("PluginInfoActionSheet");
    onPress?.();
  };
  return <IconButton {...props} />;
}

export default function PluginInfoActionSheet({
  plugin,
  navigation,
}: PluginInfoActionSheetProps) {
  plugin.usePluginState?.();

  return (
    <ActionSheet>
      <ScrollView contentContainerStyle={{ gap: 12, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 24,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <TitleComponent plugin={plugin} />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 22,
            paddingHorizontal: 4,
          }}
        >
        </View>
        <Card>
          <Text
            variant="text-md/semibold"
            color="text-primary"
            style={{
              marginBottom: 4,
              color: semanticColors.HEADER_PRIMARY,
            }}
          >
            Description
          </Text>
          <Text variant="text-md/medium">{plugin.description}</Text>
        </Card>
      </ScrollView>
    </ActionSheet>
  );
}
