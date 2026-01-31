import { type RulesType, useRulesStore } from "./rulesStore";
import { cleanUrlsSettings } from "./storage";

function toURL(url: URL): string {
    const str = url.toString();
    if (url.pathname === "/" && str.endsWith("/")) {
        return str.slice(0, -1);
    }
    return str;
}

function applyProvider(
    provider: RulesType["providers"][string],
    urlObj: URL,
): string {
    const url = urlObj.toString();
    const query = [...urlObj.searchParams.keys()];

    // Should we redirect?
    if (cleanUrlsSettings.redirect && provider.redirections) {
        const redirect = provider.redirections.find(reg =>
            url.match(new RegExp(reg, "i"))
        );
        const red = redirect && url.match(new RegExp(redirect, "i"))?.[1];
        if (red) {
            return cleanUrl(decodeURIComponent(red));
        }
    }

    // Apply raw rules
    if (provider.rawRules && query.length > 0) {
        for (const rule of provider.rawRules) {
            urlObj.search = urlObj.search.replace(new RegExp(rule, "gi"), "");
        }
    }

    // Apply rules & referrals
    const toRemove = [
        provider.rules ?? [],
        (cleanUrlsSettings.referrals && provider.referralMarketing) ?? [],
    ].flat();

    if (toRemove.length > 0 && query.length > 0) {
        for (const rule of toRemove) {
            for (const key of query) {
                if (new RegExp(`^${rule}$`, "i").test(key)) {
                    urlObj.searchParams.delete(key);
                }
            }
        }
    }

    return toURL(urlObj);
}

export function cleanUrl(url: string): string {
    const { rules } = useRulesStore.getState();
    if (!rules?.providers) return url;

    let urlObj: URL;
    try {
        urlObj = new URL(url);
    } catch {
        return url;
    }

    for (const provider of Object.values(rules.providers)) {
        if (!provider.urlPattern) continue;

        // Should we apply this rule?
        if (!new RegExp(provider.urlPattern, "i").test(url)) continue;

        if (provider.exceptions?.some(reg => new RegExp(reg, "i").test(url))) {
            continue;
        }

        try {
            urlObj = new URL(applyProvider(provider, urlObj));
        } catch {
            return toURL(urlObj);
        }
    }

    return toURL(urlObj);
}
