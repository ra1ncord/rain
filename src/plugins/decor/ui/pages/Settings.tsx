import { findAssetId } from "@api/assets";
import { TableRow, TableRowGroup } from "@metro/common/components";
import { ScrollView } from "react-native";
import { useAuthorizationStore } from "../../lib/stores/AuthorizationStore";
import showAuthorizationModal from "../../lib/utils/showAuthorizationModal";
import DecorationPicker from "../components/DecorationPicker";

export default function Settings() {
    const isAuthorized = useAuthorizationStore(state => !!state.token);
    const setToken = useAuthorizationStore(state => state.setToken);

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40, paddingVertical: 24, paddingHorizontal: 12, gap: 24 }}
        >
            {isAuthorized && (
                <DecorationPicker />
            )}
            <TableRowGroup title="Authorization">
                {!isAuthorized && (
                    <TableRow
                        label="Authorize with Decor"
                        icon={<TableRow.Icon source={findAssetId("ic_link_24px")} />}
                        onPress={showAuthorizationModal}
                    />
                )}
                {isAuthorized && (
                    <>
                        <TableRow
                            label="Authorized"
                            subLabel="You are logged in"
                            icon={<TableRow.Icon source={findAssetId("CircleCheckIcon")} />}
                            disabled
                        />
                        <TableRow
                            variant="danger"
                            label="Log out"
                            subLabel="Disconnect your account from Decor"
                            icon={<TableRow.Icon variant="danger" source={findAssetId("DoorExitIcon")} />}
                            onPress={() => setToken(null as any)}
                        />
                    </>
                )}
            </TableRowGroup>
        </ScrollView>
    );
}
