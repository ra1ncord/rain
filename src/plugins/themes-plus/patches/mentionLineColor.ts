import { findByProps } from "@metro/wrappers";
import { after } from "@api/patcher";
import { PatchType } from "..";
import { state } from "../stuff/active";
import { patches } from "../stuff/loader";
import resolveColor from "../stuff/resolveColor";

const RowGeneratorUtils = findByProps("createBackgroundHighlight");

const androidifyColor = (color: string, alpha: number) => {
    return color; 
};

export default function patchMentionLineColors(plus: any) {
if (plus.mentionLineColor) {
state.patches.push(PatchType.MentionLineColor);

patches.push(
after(
"createBackgroundHighlight",
RowGeneratorUtils,
([x], ret) => {
const clr = resolveColor(plus.mentionLineColor!);
if (x?.message?.mentioned && clr) {
ret.gutterColor = androidifyColor(clr, 200);
}
},
),
);
}
}
