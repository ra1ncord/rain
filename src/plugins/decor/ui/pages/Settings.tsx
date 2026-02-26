import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { TableRow, TableRowGroup } from "@metro/common/components";
import { View } from "react-native";

import { useAuthorizationStore } from "../../lib/stores/AuthorizationStore";
import showAuthorizationModal from "../../lib/utils/showAuthorizationModal";
import DecorationPicker from "../components/DecorationPicker";

const useStyles = createStyles(_ => ({
    versionText: {
        fontSize: 15,
        color: semanticColors.TEXT_NORMAL,
        textAlign: "center",
        fontWeight: "600",
        lineHeight: 22,
    },
}));

export default function Settings() {
    const isAuthorized = useAuthorizationStore(state => !!state.token);
    const setToken = useAuthorizationStore(state => state.setToken);

    const styles = useStyles();

    return (
        <View style={{ flex: 1, paddingVertical: 24, paddingHorizontal: 12, gap: 24 }}>
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
                )} {isAuthorized && (
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
        </View>
    );
}
