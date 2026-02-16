import { findAssetId } from "@api/assets";
import { ErrorBoundary } from "@api/ui/components";
import { Observable } from "@gullerya/object-observer";
import { safeFetch } from "@lib/utils";
import { lazyDestructure } from "@lib/utils/lazy";
import { NavigationNative } from "@metro/common";
import { ActionSheet, BottomSheetTitleHeader, Button, IconButton, Stack, TableRow, TableRowGroup, Text, TextInput } from "@metro/common/components";
import { findByProps, findByPropsLazy } from "@metro/wrappers";
import { FontDefinition, removeFont, saveFont, updateFont, useFonts, validateFont } from "@plugins/_core/painter/fonts";
import { Strings } from "@i18n";
import React, { useMemo, useReducer,useRef, useState } from "react";
import { ScrollView, View } from "react-native";

const actionSheet = findByPropsLazy("hideActionSheet");
const { openAlert } = lazyDestructure(() => findByProps("openAlert", "dismissAlert"));
const { AlertModal, AlertActionButton } = lazyDestructure(() => findByProps("AlertModal", "AlertActions"));

function promptDetachConfirmationForThen(fontName: string | undefined, cb: () => void) {
    const currentFonts = useFonts.getState().fonts;
    if (fontName && currentFonts[fontName].source) openAlert("revenge-fonts-detach-source-confirmation", <AlertModal
        title={Strings.FONTS_DETACH_URL}
        content={Strings.FONTS_DETACH_URL_DESC}
        actions={
            <Stack>
                <AlertActionButton text={Strings.FONTS_DETACH} variant="destructive" onPress={() => {
                    const font = { ...currentFonts[fontName!] };
                    delete font.source;
                    useFonts.getState().setFont(fontName!, font);
                    cb();
                }} />
                <AlertActionButton text={Strings.CANCEL} variant="secondary" />
            </Stack>
        }
    />);
    else cb();
}

function guessFontName(urls: string[]) {
    const fileNames = urls.map(url => {
        const { pathname } = new URL(url);
        const fileName = pathname.replace(/\.[^/.]+$/, "");
        return fileName.split("/").pop();
    }).filter(Boolean) as string[];

    const shortest = fileNames.reduce((shortest, name) => {
        return name.length < shortest.length ? name : shortest;
    }, fileNames[0] || "");

    return shortest?.replace(/-[A-Za-z]*$/, "") || null;
}

function FontsExtractor({ fonts, setName }: {
    fonts: Record<string, string>;
    setName: (name: string) => void;
}) {
    // @ts-ignore
    const themeFonts = currentTheme!.fonts as Record<string, string>;

    const [fontName, setFontName] = useState(guessFontName(Object.values(themeFonts)));
    const [error, setError] = useState<string | undefined>(undefined);

    return <View style={{ padding: 8, paddingBottom: 16, gap: 12 }}>
        <TextInput
            autoFocus
            size="md"
            label={Strings.FONT_NAME}
            value={fontName}
            placeholder={fontName || "Whitney"}
            onChange={setFontName}
            errorMessage={error}
            state={error ? "error" : void 0}
        />
        <Text variant="text-xs/normal" color="text-muted">
            text
        </Text>
        <Button
            size="md"
            variant="primary"
            text={Strings.EXTRACT}
            disabled={!fontName}
            onPress={() => {
                if (!fontName) return;
                try {
                    validateFont({
                        spec: 1,
                        name: fontName,
                        main: themeFonts
                    });

                    setName(fontName);
                    Object.assign(fonts, themeFonts);
                    actionSheet.hideActionSheet();
                } catch (e) {
                    setError(String(e));
                }
            }}
        />
    </View>;
}

function JsonFontImporter({ fonts, setName, setSource }: {
    fonts: Record<string, string>;
    setName: (name: string) => void;
    setSource: (source: string) => void;
}) {
    const [fontLink, setFontLink] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    return <View style={{ padding: 8, paddingBottom: 16, gap: 12 }}>
        <TextInput
            autoFocus
            size="md"
            label={Strings.FONT_LINK}
            value={fontLink}
            placeholder="https://link.to/font/pack.json"
            onChange={setFontLink}
            errorMessage={error}
            state={error ? "error" : void 0}
        />
        <Button
            size="md"
            variant="primary"
            text={Strings.IMPORT}
            disabled={!fontLink || saving}
            loading={saving}
            onPress={() => {
                setSaving(true);
                setError(undefined);

                (async () => {
                    const res = await safeFetch(fontLink, { cache: "no-store" });
                    const json = await res.json() as FontDefinition;
                    validateFont(json);

                    // Clear existing entries
                    Object.keys(fonts).forEach(key => delete fonts[key]);
                    // Add new entries
                    Object.assign(fonts, json.main);

                    setName(json.name);
                    setSource(fontLink);
                })()
                    .then(() => actionSheet.hideActionSheet())
                    .catch(e => setError(String(e)))
                    .finally(() => setSaving(false));
            }}
        />
    </View>;
}

function EntryEditorActionSheet(props: {
    fontEntries: Record<string, string>;
    name: string;
    onChange: () => void;
}) {
    const [familyName, setFamilyName] = useState<string>(props.name);
    const [fontUrl, setFontUrl] = useState<string>(props.fontEntries[props.name]);

    return <View style={{ padding: 8, paddingBottom: 16, gap: 12 }}>
        <TextInput
            autoFocus
            size="md"
            label={Strings.FAMILY_NAME}
            value={familyName}
            placeholder="ggsans-Bold"
            onChange={setFamilyName}
        />
        <TextInput
            size="md"
            label={Strings.FONT_URL}
            value={fontUrl}
            placeholder="https://link.to/the/font.ttf"
            onChange={setFontUrl}
        />
        <Button
            size="md"
            variant="primary"
            text={Strings.APPLY}
            onPress={() => {
                delete props.fontEntries[props.name];
                props.fontEntries[familyName] = fontUrl;
                props.onChange();
                actionSheet.hideActionSheet();
            }}
        />
    </View>;
}

function promptActionSheet(
    Component: any,
    fontEntries: Record<string, string>,
    props: any
) {
    actionSheet.openLazy(
        Promise.resolve({
            default: () => (
                <ErrorBoundary>
                    <ActionSheet>
                        <BottomSheetTitleHeader title={Strings.IMPORT_TITLE} />
                        <Component fonts={fontEntries} {...props} />
                    </ActionSheet>
                </ErrorBoundary>
            )
        }),
        "FontEditorActionSheet"
    );
}

function NewEntryRow({ fontName, fontEntry }: { fontName: string | undefined, fontEntry: Record<string, string>; }) {
    const nameRef = useRef<string | undefined>(undefined);
    const urlRef = useRef<string | undefined>(undefined);

    const [nameSet, setNameSet] = useState(false);
    const [error, setError] = useState<string | undefined>();

    return <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-start" }}>
        <View style={{ flex: 1 }}>
            <TextInput
                isRound
                size="md"
                label={nameSet ? nameRef.current : void 0}
                placeholder={nameSet ? "https://path.to/the/file.ttf" : "PostScript name (e.g. ggsans-Bold)"}
                leadingIcon={() => nameSet ? null : <TableRow.Icon source={findAssetId("PlusSmallIcon")} />}
                leadingText={nameSet ? nameRef.current : ""}
                onChange={(text: string) => (nameSet ? urlRef : nameRef).current = text}
                errorMessage={error}
                state={error ? "error" : void 0}
            />
        </View>
        {nameSet && <IconButton
            size="md"
            variant="secondary"
            onPress={() => {
                nameRef.current = "";
                setNameSet(false);
            }}
            icon={findAssetId("TrashIcon")}
        />}
        <IconButton
            size="md"
            variant="primary"
            onPress={() => promptDetachConfirmationForThen(fontName, () => {
                if (!nameSet && nameRef.current) {
                    setNameSet(true);
                } else if (nameSet && nameRef.current && urlRef.current) {
                    try {
                        const parsedUrl = new URL(urlRef.current);
                        if (!parsedUrl.protocol || !parsedUrl.host) {
                            throw "Invalid URL";
                        }

                        fontEntry[nameRef.current] = urlRef.current;
                        nameRef.current = undefined;
                        urlRef.current = undefined;
                        setNameSet(false);
                    } catch (e) {
                        setError(String(e));
                    }
                }
            })}
            icon={findAssetId(nameSet ? "PlusSmallIcon" : "ArrowLargeRightIcon")}
        />
    </View>;
}

export default function FontEditor(props: {
    name?: string;
}) {
    const currentFonts = useFonts(state => state.fonts);
    const [name, setName] = useState<string | undefined>(props.name);
    const [source, setSource] = useState<string | undefined>(props.name && currentFonts[props.name]?.source);
    const [importing, setIsImporting] = useState<boolean>(false);
    const [errors, setErrors] = useState<Array<Error | undefined> | undefined>();

    const memoEntry = useMemo(() => {
        return Observable.from(props.name ? { ...currentFonts[props.name]?.main } : {});
    }, [props.name, currentFonts]);

    const fontEntries: Record<string, string> = memoEntry;

    const navigation = NavigationNative.useNavigation();

    const [, forceUpdate] = useReducer(() => ({}), 0);

    return <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
        <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={12}>
            {!props.name
                ? <TableRowGroup title={Strings.IMPORT}>
                    {Object.keys(currentFonts).length > 0 && <TableRow
                        label={Strings.EXTRACT_FROM_THEME}
                        subLabel={Strings.EXTRACT_FROM_THEME_DESC}
                        icon={<TableRow.Icon source={findAssetId("HammerIcon")} />}
                        onPress={() => promptActionSheet(FontsExtractor, fontEntries, { setName })}
                    />}
                    <TableRow
                        label={Strings.IMPORT_ENTRIES_TITLE}
                        subLabel={Strings.IMPORT_ENTRIES_TITLE_DESC}
                        icon={<TableRow.Icon source={findAssetId("LinkIcon")} />}
                        onPress={() => promptActionSheet(JsonFontImporter, fontEntries, { setName, setSource })}
                    />
                </TableRowGroup>
                : <TableRowGroup title={Strings.ACTIONS}>
                    <TableRow
                        label={Strings.REFETCH_FONTS}
                        icon={<TableRow.Icon source={findAssetId("RetryIcon")} />}
                        onPress={async () => {
                            await updateFont(currentFonts[props.name!]);
                            navigation.goBack();
                        }}
                    />
                    <TableRow
                        variant="danger"
                        label={Strings.DELETE_FONT_PACK}
                        icon={<TableRow.Icon variant="danger" source={findAssetId("TrashIcon")} />}
                        onPress={() => removeFont(props.name!).then(() => navigation.goBack())}
                    />
                </TableRowGroup>}
            <TextInput
                size="lg"
                value={name}
                label={Strings.FONT_NAME}
                placeholder="Whitney"
                onChange={setName}
            />
            {props.name && currentFonts[props.name]?.source && <TextInput
                size="lg"
                value={source}
                label={Strings.FONT_PACK_URL}
                onChange={setSource}
            />}
            <TableRowGroup title={Strings.FONT_ENTRIES}>
                {Object.entries(fontEntries).map(([name, url], index) => {
                    const error = errors?.[index];

                    return <TableRow
                        key={name}
                        label={name}
                        subLabel={error ? <Text variant="text-xs/medium" color="text-danger">{error.message}</Text> : url}
                        trailing={<Stack spacing={8} direction="horizontal">
                            <IconButton
                                size="sm"
                                variant="secondary"
                                icon={findAssetId("PencilIcon")}
                                onPress={() => promptDetachConfirmationForThen(props.name, () =>
                                    promptActionSheet(EntryEditorActionSheet, fontEntries, {
                                        name,
                                        fontEntries,
                                        onChange: () => {
                                            setErrors(undefined);
                                            forceUpdate();
                                        }
                                    })
                                )}
                            />
                            <IconButton
                                size="sm"
                                variant="secondary"
                                icon={findAssetId("TrashIcon")}
                                onPress={() => promptDetachConfirmationForThen(props.name, () => {
                                    delete fontEntries[name];
                                    setErrors(undefined);
                                })}
                            />
                        </Stack>}
                    />;
                })}
                <TableRow label={<NewEntryRow fontName={props.name} fontEntry={fontEntries} />} />
            </TableRowGroup>
            {errors && <Text variant="text-sm/medium" color="text-danger">{Strings.SOME_ENTRIES_ERROR}</Text>}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", bottom: 0, left: 0 }}>
                <Button
                    size="lg"
                    loading={importing}
                    disabled={importing || !name || Object.keys(fontEntries).length === 0}
                    variant="primary"
                    text={props.name ? Strings.SAVE : Strings.IMPORT}
                    onPress={async () => {
                        if (!name) return;

                        setErrors(undefined);
                        setIsImporting(true);

                        if (!props.name) {
                            saveFont({
                                spec: 1,
                                name: name,
                                main: fontEntries,
                                source
                            })
                                .then(() => navigation.goBack())
                                .catch(e => setErrors(e))
                                .finally(() => setIsImporting(false));
                        } else {
                            const updatedFont = {
                                ...currentFonts[props.name],
                                name: name,
                                main: fontEntries,
                            };

                            useFonts.getState().setFont(props.name, updatedFont);

                            updateFont(updatedFont)
                                .then(() => navigation.goBack())
                                .catch(e => setErrors(e))
                                .finally(() => setIsImporting(false));
                        }
                    }}
                    icon={findAssetId(props.name ? "toast_image_saved" : "DownloadIcon")}
                    style={{ marginLeft: 8 }}
                />
            </View>
        </Stack>
    </ScrollView>;
}
