import { Codeblock } from "@api/ui/components";
import { Button, Card, Stack, Text, TwinButtons } from "@metro/common/components";
import { ReactNode } from "react";

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
                : <Text variant="heading-lg/bold">{props.header ?? "uh oh"}</Text>
            }
            <Codeblock selectable={true}>{String(props.error)}</Codeblock>
        </Stack>
    </Card>;
}
