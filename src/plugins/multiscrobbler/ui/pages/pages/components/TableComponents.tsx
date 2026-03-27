import { SliderRow } from "@api/ui/components/SliderRow";
import { findByProps } from "@metro";

export const { ScrollView } = findByProps("ScrollView");
export const {
    Card,
    TableRowGroup,
    TableSwitchRow,
    TableCheckboxRow,
    TableRadioRow,
    TableRadioGroup,
    Stack,
    TableRow,
} = findByProps(
    "Card",
    "TableSwitchRow",
    "TableCheckboxRow",
    "TableRowGroup",
    "Stack",
    "TableRow",
    "TableRadioRow",
    "TableRadioGroup",
);
export const { TextInput } = findByProps("TextInput");
export { SliderRow };
