import { hideblockedandignoredmessagesSettings as settings } from './storage';
import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView, View } from "react-native";

export default function Settings() {
	return (
		<ScrollView style={{ flex: 1 }}>
			<Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
				<View>
					<TableRowGroup title="HideBlockedAndIgnoredMessages">
						<TableSwitchRow
							label="Remove blocked messages"
							value={settings.blocked ?? true}
							onValueChange={(v:boolean) => (settings.blocked = v)}
						/>
						<TableSwitchRow
							label="Remove ignored messages"
							value={settings.ignored ?? true}
							onValueChange={(v:boolean) => (settings.ignored = v)}
						/>
						<TableSwitchRow
							label="Remove replies to blocked/ignored users"
							value={settings.removeReplies ?? true}
							onValueChange={(v:boolean) => (settings.removeReplies = v)}
							subLabel="Filters messages replying to blocked or ignored users."
						/>
					</TableRowGroup>
				</View>
			</Stack>
		</ScrollView>
	);
}
