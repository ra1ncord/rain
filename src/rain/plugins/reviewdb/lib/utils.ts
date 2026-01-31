import { APIResponse, Review } from "../def";
import { admins } from "..";
import { findByProps, findByStoreName } from "@metro";
import { cyrb64Hash } from "@lib/utils/cyrb64";
import { metro } from "@lib";
import { semanticColors } from "@api/ui/components/color";

export const find = (filter: (m: any) => boolean) => {
    return metro.findExports(
        metro.factories.createSimpleFilter(
            filter,
            cyrb64Hash(new Error().stack!),
        ),
    );
};

const { getCurrentUser } = findByStoreName("UserStore");
const resolveSemanticColor: (theme: string, semanticColor: object) => string =
    find((m) => m.default?.internal?.resolveSemanticColor)?.default.internal
        .resolveSemanticColor ??
    find((m) => m.meta?.resolveSemanticColor)?.meta.resolveSemanticColor ??
    (() => {});
const { useThemeContext } = findByProps("useThemeContext");

export const canDeleteReview = (review: Review) =>
    review.sender.discordID === getCurrentUser()?.id ||
    admins.includes(getCurrentUser()?.id);

export async function jsonFetch<T = APIResponse>(
    input: RequestInfo | URL,
    options?: RequestInit,
): Promise<T> {
    const req = await fetch(input, {
        headers: {
            "content-type": "application/json",
            accept: "application/json",
        },
        ...options,
    });

    const json = await req.json();
    if (json.success === false) throw new Error(json.message);

    return json;
}

const semanticColorAlternatives: Record<string, string> = {
    TEXT_NORMAL: "TEXT_DEFAULT",
};

// I think Discord have a hook like this but it confused me to no end, so I made my own!
export const useThemedColor = (key: string) => {
    if (!semanticColors[key] && semanticColorAlternatives[key])
        key = semanticColorAlternatives[key];

    return (
        (semanticColors[key] &&
            resolveSemanticColor(
                useThemeContext()?.theme ?? "dark",
                semanticColors[key],
            )) ||
        "#000000"
    );
};
