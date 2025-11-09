import { registeredPlugins } from "@plugins";
import { developer as Author } from "@plugins/types";
import { findAssetId } from "@lib/api/assets";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { NavigationNative } from "@metro/common";
import {
  Button,
  Card,
  FlashList,
  IconButton,
  Stack,
  TableRow,
  TableRowGroup,
  Text,
} from "@metro/common/components";
import { ComponentProps } from "react";
import { Linking, ScrollView, View } from "react-native";

export default function pluginsPage() {

    const navigation = NavigationNative.useNavigation();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
              
            </Stack>
        </ScrollView>
    );
}
