import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { React, ReactNative as RN } from "@metro/common";
import { FlashList, Text } from "@metro/common/components";

import { useMonetSettings } from "../../storage";
import Commit, { CommitState } from "../Commit";
import useCommits from "../../hooks/useCommits";

export default function CommitsPage() {
    const patches = useMonetSettings(s => s.patches);
    const updateSettings = useMonetSettings(s => s.updateSettings);
    const { commits } = useCommits();

    const parsedCommits = React.useMemo(
        () =>
            commits
                ? commits.map((commit, i) => ({
                    commit,
                    state:
                        patches.commit === commit.sha
                            ? CommitState.Selected
                            : i === 0 && !patches.commit
                                ? CommitState.Default
                                : undefined,
                }))
                : [],
        [commits, patches.commit],
    );

    return (
        <FlashList
            ItemSeparatorComponent={() => <RN.View style={{ height: 12 }} />}
            ListFooterComponent={<RN.View style={{ height: 20 }} />}
            ListHeaderComponent={
                <RN.View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16, paddingVertical: 8 }}>
                    <RN.Pressable
                        onPress={() => {
                            updateSettings({
                                patches: { ...patches, commit: undefined },
                            });
                            showToast(
                                "Using latest commit for patches",
                                findAssetId("ArrowAngleLeftUpIcon"),
                            );
                        }}
                        disabled={!patches.commit}
                    >
                        <Text
                            variant={!patches.commit ? "text-md/normal" : "text-md/semibold"}
                            color={!patches.commit ? "TEXT_MUTED" : "TEXT_BRAND"}
                        >
                            Use latest
                        </Text>
                    </RN.Pressable>
                </RN.View>
            }
            estimatedItemSize={79.54}
            data={parsedCommits}
            extraData={patches.commit}
            keyExtractor={(item: any) => item.commit.sha}
            renderItem={({ item: { commit, state } }: any) => (
                <Commit
                    commit={commit}
                    onPress={() =>
                        updateSettings({
                            patches: { ...patches, commit: commit.sha },
                        })
                    }
                    state={state}
                />
            )}
            removeClippedSubviews
        />
    );
}
