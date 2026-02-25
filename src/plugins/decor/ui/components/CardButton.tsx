import { findByProps } from "@metro";
import { Forms } from "@metro/common/components";

import Card from "./Card";
import Icon from "./Icon";

const { FormIcon } = Forms;
const { TextStyleSheet, Text } = findByProps("TextStyleSheet");

export default function CardButton({ source, label, onPress, disabled, lookDisabled = false, selected = false }) {
    return (
        <Card onPress={onPress} disabled={disabled} lookDisabled={lookDisabled} selected={selected}>
            <Icon source={source} />
            <Text style={[TextStyleSheet["text-sm/medium"]]}>{label}</Text>
        </Card>
    );
}
