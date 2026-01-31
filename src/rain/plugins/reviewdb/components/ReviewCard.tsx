import ReviewActionSheet from "./ReviewActionSheet";
import { ActionSheet } from "./ActionSheet";
import { findByProps } from "@metro";
import { ErrorBoundary } from "@api/ui/components";
const { TableRow, TableRowGroup } = findByProps("TableRow");

interface ReviewCardProps {
    userId: string;
}

export default function ReviewCard({ userId }: ReviewCardProps) {
    return (
        <ErrorBoundary>
            <TableRowGroup>
                <TableRow
                    label="Reviews"
                    onPress={() => {
                        ActionSheet.open(ReviewActionSheet, { userId });
                    }}
                />
            </TableRowGroup>
        </ErrorBoundary>
    );
}
