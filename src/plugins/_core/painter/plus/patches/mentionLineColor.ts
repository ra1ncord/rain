import { after } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro/wrappers";

import { PatchType } from "..";
import { state } from "../stuff/active";
import { patches } from "../stuff/loader";
import resolveColor from "../stuff/resolveColor";

const RowGeneratorUtils = findByProps("createBackgroundHighlight");

export default function patchMentionLineColors(plus: any) {
    if (plus.mentionLineColor) {
        state.patches.push(PatchType.MentionLineColor);
        patches.push(
            after(
                "createBackgroundHighlight",
                RowGeneratorUtils,
                ([x], ret) => {
                    if (!ret || !x?.message?.mentioned) return;
                
                    const clr = resolveColor(plus.mentionLineColor!);
                    if (!clr) return;
                
                    const hex = clr.startsWith("#") && clr.length === 9 ? `#${clr.slice(3)}` : clr;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                
                    ret.gutterColor = ((0xFF000000 | (r << 16) | (g << 8) | b) | 0);
                },
            ),
        );
    }
}