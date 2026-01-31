// Taken from https://github.com/nexpid/RevengePlugins
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import {
    TextInputProps,
    PressableProps,
    ImageSourcePropType,
    ViewProps,
} from "react-native";

const { bunny } = window as any;
const NotFound = (prop: string, isFunction?: boolean) => () => {
    const trigger = () => {
        showToast(`${prop} not found! Search for PNF in Debug Logs!`);
        console.warn(
            `!! PNF ERROR !!\nMissing the redesign ${
                isFunction ? "function" : "component"
            }: ${prop}. Please bug @nexpid about this on Discord!`,
        );
    };

    if (isFunction) trigger();
    else React.useEffect(trigger, []);

    return null;
};

const findProp = (...props: string[]) => findByProps(...props)?.[props[0]];
const findPropPolyfill = (isFunction: boolean, ...props: string[]) =>
    findProp(...props) ?? NotFound(props[0], isFunction);

export type _TextInput = React.FC<
    Omit<TextInputProps, "onChange"> & {
        onChange?: (value: string) => void;
        size?: "sm" | "md" | "lg";
        label?: string;
        description?: React.ReactNode;
        focusable?: boolean;
        isDisabled?: boolean;
        leadingPressableProps?: PressableProps;
        leadingIcon?: React.FC;
        leadingText?: string;
        trailingPressableProps?: PressableProps;
        trailingIcon?: React.FC;
        trailingText?: string;
        isClearable?: boolean;
        status?: "error" | "default";
        errorMessage?: string;
        isCentered?: boolean;
        grow?: boolean;
        isRound?: boolean;
        ref?: any;
    }
>;

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "tertiary"
    | "primary-overlay"
    | "secondary-overlay"
    | "destructive"
    | "active";

export interface PrimitiveButton {
    onPress?: () => void;
    disabled?: boolean;
    icon?: ImageSourcePropType | React.ReactNode;
    style?: ViewProps["style"];
}
export interface PrimitiveButtonIcon {
    source: ImageSourcePropType;
}

export type _Button = React.FC<
    PrimitiveButton & {
        variant?: ButtonVariant;
        size?: "sm" | "md" | "lg";
        text: string;
        iconPosition?: "start" | "end";
        grow?: boolean;
        loading?: boolean;
        onPressIn?: () => void;
        onPressOut?: () => void;
    }
> & {
    Icon: React.FC<PrimitiveButtonIcon>;
};

export const TextInput = findPropPolyfill(false, "TextInput") as _TextInput;
export const Button = findPropPolyfill(false, "Button") as _Button;
