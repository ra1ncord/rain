import { findAssetId } from "@api/assets";
import ErrorBoundary from "@api/ui/components/ErrorBoundary";
import { TextInput } from "@metro/common/components";
import { Strings } from "@rain/i18n";
import { Image, View, ViewStyle } from "react-native";

export interface SearchProps {
    onChangeText?: (v: string) => void;
    placeholder?: string;
    style?: ViewStyle;
    isRound?: boolean;
}

function SearchIcon() {
    return <Image style={{ width: 16, height: 16 }} source={findAssetId("icon-search")!} />;
}

export default ({ onChangeText, placeholder, style, isRound }: SearchProps) => {
    const [query, setQuery] = React.useState("");

    const onChange = (value: string) => {
        setQuery(value);
        onChangeText?.(value);
    };

    return <ErrorBoundary>
        <View style={style}>
            <TextInput
                grow={true}
                isClearable={true}
                leadingIcon={SearchIcon}
                placeholder={placeholder ?? Strings.SEARCH_PLACEHOLDER}
                onChange={onChange}
                returnKeyType="search"
                size="md"
                autoCapitalize="none"
                autoCorrect={false}
                isRound={isRound}
                value={query}
            />
        </View>
    </ErrorBoundary>;
};
