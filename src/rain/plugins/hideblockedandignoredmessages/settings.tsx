import { hideblockedandignoredmessagesSettings as settings } from './storage';
import { ReactNative } from "@metro/common";
import {findByProps} from "@metro";

const { View, ScrollView } = ReactNative;

const { TableSwitchRow } = findByProps("TableRow");

export default function Settings() {

	return (
		<ScrollView>
			<View>
				<TableSwitchRow
					label="Remove blocked messages"
					value={settings.blocked ?? true}
					onValueChange={(v:boolean) => (settings.blocked = v)}
					note=""
				/>
				<TableSwitchRow
					label="Remove ignored messages"
					value={settings.ignored ?? true}
					onValueChange={(v:boolean) => (settings.ignored = v)}
					note=""
				/>
				<TableSwitchRow
					label="Remove replies to blocked/ignored users"
					value={settings.removeReplies ?? true}
					onValueChange={(v:boolean) => (settings.removeReplies = v)}
					note="Filters messages replying to blocked or ignored users."
				/>
			</View>
		</ScrollView>
	);
}
