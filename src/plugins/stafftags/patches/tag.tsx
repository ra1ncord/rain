import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByProps } from "@metro";

const Tag = findByProps("getBotLabel");

export default () => {
    if (!Tag) return () => {};

    return after("default", Tag, ([{ text, textColor, backgroundColor }]: any, ret: any) => {
        const label = findInReactTree(ret, (c: any) => typeof c?.props?.children === "string");

        if (!label) return;

        if (text) label.props.children = text;
        if (textColor && label.props?.style) label.props.style.push({ color: textColor });
        if (backgroundColor && ret?.props?.style) ret.props.style.push({ backgroundColor });
    });
};
