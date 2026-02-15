import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { clipboard } from "@metro/common";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";
import { ScrollView } from "react-native";

import Text from "../components/Text";

export default function NekosLifeCategoriesPage() {
    const sfwCategories = [
        { name: "Avatar", value: "avatar" },
        { name: "Classic", value: "classic" },
        { name: "Cuddle", value: "cuddle" },
        { name: "Fox Girl", value: "fox_girl" },
        { name: "Gecg", value: "gecg" },
        { name: "Holo", value: "holo" },
        { name: "Kemonomimi", value: "kemonomimi" },
        { name: "Kiss", value: "kiss" },
        { name: "Neko", value: "neko" },
        { name: "Neko GIF", value: "ngif" },
        { name: "Smug", value: "smug" },
        { name: "Spank", value: "spank" },
        { name: "Tickle", value: "tickle" },
        { name: "Waifu", value: "waifu" },
        { name: "Wallpaper", value: "wallpaper" },
        { name: "Woof", value: "woof" },
    ].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <Text variant="text-md/bold" color="TEXT_MUTED" align="center">
          Total Categories: {sfwCategories.length}
                    {"\n\n"}
          Use these category names with the /nekoslife command.
                </Text>

                <TableRowGroup title="SFW Categories">
                    {sfwCategories.map((category) => (
                        <TableRow
                            key={category.value}
                            label={category.name}
                            trailing={<TableRow.TrailingText text={category.value} />}
                            onPress={() => {
                                clipboard.setString(category.value);
                                showToast(`Copied "${category.value}" category to clipboard`, findAssetId("ClipboardCheckIcon"));
                            }}
                        />
                    ))}
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
