import { NavigationNative, ReactNative } from "@metro/common";
import {
    Stack,
    TableRadio,
    TableRow,
    TableRowGroup,
    TableSwitch,
    TableSwitchRow,
    Text,
} from "@metro/common/components";
import React from "react";

import { AnimalSource, sources } from "./sources";
import { ensureAnimalDefaults, getAnimalSourceId, useAnimalCommandsSettings } from "./storage";

const { ScrollView, View } = ReactNative;

type AnimalSettingsPageProps = {
    animalId: string;
};

const AnimalSettingsPage = ({ animalId }: AnimalSettingsPageProps) => {
    const settings = useAnimalCommandsSettings();
    const animal = sources.find(entry => entry.id === animalId);

    React.useEffect(() => {
        ensureAnimalDefaults();
    }, []);

    if (!animal) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Text variant="text-md/medium">Animal not found.</Text>
            </View>
        );
    }

    const enabled = settings.enabled?.[animal.id] ?? true;
    const selectedSourceId = getAnimalSourceId(animal.id) ?? animal.sources[0]?.id ?? "";

    const updateEnabled = (value: boolean) => {
        const state = useAnimalCommandsSettings.getState();
        state.updateSettings({
            enabled: {
                ...(state.enabled ?? {}),
                [animal.id]: value,
            },
        });
    };

    const updateSource = (value: string) => {
        const state = useAnimalCommandsSettings.getState();
        state.updateSettings({
            source: {
                ...(state.source ?? {}),
                [animal.id]: value,
            },
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                    <TableRowGroup title="Enabled/Disabled">
                        <TableSwitchRow
                            label="Enabled"
                            subLabel="Show this command in the command list"
                            value={enabled}
                            onValueChange={updateEnabled}
                        />
                    </TableRowGroup>

                    <TableRowGroup title="Image Source">
                        {animal.sources.map(source => (
                            <TableRow
                                key={source.id}
                                label={source.label}
                                subLabel={source.description}
                                trailing={
                                    <TableRadio selected={selectedSourceId === source.id} />
                                }
                                onPress={() => updateSource(source.id)}
                            />
                        ))}
                    </TableRowGroup>
                </Stack>
            </ScrollView>
        </View>
    );
};

export default function AnimalCommandsSettings() {
    const navigation = NavigationNative.useNavigation();
    const settings = useAnimalCommandsSettings();

    React.useEffect(() => {
        ensureAnimalDefaults();
    }, []);

    const getSelectedSource = (animal: AnimalSource) => {
        const selectedId = getAnimalSourceId(animal.id);
        return animal.sources.find(source => source.id === selectedId) ?? animal.sources[0];
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Animals">
                    {sources.map(animal => {
                        const enabled = settings.enabled?.[animal.id] ?? true;
                        const selectedSource = getSelectedSource(animal);
                        const sourceLabel = selectedSource?.label ?? "Unknown";

                        return (
                            <TableRow
                                key={animal.id}
                                label={animal.name}
                                subLabel={`${animal.description} • Source: ${sourceLabel}`}
                                trailing={
                                    <TableSwitch
                                        value={enabled}
                                        onValueChange={(value: boolean) => {
                                            const state = useAnimalCommandsSettings.getState();
                                            state.updateSettings({
                                                enabled: {
                                                    ...(state.enabled ?? {}),
                                                    [animal.id]: value,
                                                },
                                            });
                                        }}
                                    />
                                }
                                onPress={() =>
                                    navigation.push("RAIN_CUSTOM_PAGE", {
                                        title: animal.name,
                                        render: () => <AnimalSettingsPage animalId={animal.id} />,
                                    })
                                }
                            />
                        );
                    })}
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
