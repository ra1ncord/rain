import { findByProps } from "@metro";

export const { ScrollView } = findByProps("ScrollView");
export const {
    TableRowGroup,
    TableSwitchRow,
    TableCheckboxRow,
    TableRadioRow,
    TableRadioGroup,
    Stack,
    TableRow,
} = findByProps(
    "TableSwitchRow",
    "TableCheckboxRow",
    "TableRowGroup",
    "Stack",
    "TableRow",
    "TableRadioRow",
    "TableRadioGroup",
);
export const { TextInput } = findByProps("TextInput");
