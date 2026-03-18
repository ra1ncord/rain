import { findAssetId } from "@api/assets";
import { Codeblock } from "@api/ui/components";
import { showSheet } from "@api/ui/sheets";
import { Button, Card, Stack, Text, TwinButtons } from "@metro/common/components";
import { Strings } from "@rain/i18n";
import { ReactNode } from "react";

import ErrorDetailsActionSheet from "./ErrorDetailsActionSheet";

export const INDEX_BUNDLE_FILE: string = window.HermesInternal.getFunctionLocation(window.__r).fileName;

interface ErrorCardProps {
    error: unknown;
    header?: string | ReactNode;
    onRetryRender?: () => void;
}

export default function ErrorCard(props: ErrorCardProps) {
    return <Card>
        <Stack>
            {props.header && typeof props.header !== "string"
                ? props.header
                : <Text variant="heading-lg/bold">{props.header ?? Strings.GENERAL.CORE.UH_OH}</Text>
            }
            <Codeblock selectable={true}>{String(props.error)}</Codeblock>
            <TwinButtons>
                {props.onRetryRender && <Button
                    variant="destructive"
                    icon={findAssetId("RetryIcon")}
                    text={Strings.GENERAL.CORE.RETRY_RENDER}
                    onPress={props.onRetryRender}
                />}
                {props.error instanceof Error ? <Button
                    text={"Details"}
                    icon={findAssetId("CircleInformationIcon-primary")}
                    onPress={() => showSheet(
                        "BunnyErrorDetailsActionSheet",
                        ErrorDetailsActionSheet,
                        { error: props.error as Error }
                    )}
                /> : null}
            </TwinButtons>
        </Stack>
    </Card>;
}
