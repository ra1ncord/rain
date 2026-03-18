import { logger } from "@lib/utils/logger";
import { FluxDispatcher } from "@metro/common";
import { findByNameLazy, findByStoreName } from "@metro/wrappers";
import { PrimitiveType } from "intl-messageformat";

import general from "./default/general.json";
import plugins from "./default/plugins.json";

const langDefault = {
    GENERAL: general,
    PLUGINS: plugins,
};

const IntlMessageFormat = findByNameLazy(
    "MessageFormat",
) as typeof import("intl-messageformat").default;

type NestedKeys<T, Prev extends string = ""> = {
    [K in keyof T]: T[K] extends object
        ? T[K] extends any[]
            ? `${Prev}${K & string}`
            : NestedKeys<T[K], `${Prev}${K & string}.`>
        : `${Prev}${K & string}`;
}[keyof T];

type I18nKey = NestedKeys<typeof langDefault>;

let _currentLocale: string | null = null;
let _lastSetLocale: string | null = null;

const _loadedLocale = new Set<string>();
const _loadedStrings = {} as Record<string, typeof langDefault>;

function getNested(
    obj: any,
    path: string,
    fallbackObj?: any
): any {
    const parts = path.split(".");
    let result = obj;

    for (const part of parts) {
        if (result && part in result) {
            result = result[part];
        } else {
            result = undefined;
            break;
        }
    }

    // treat undefined or empty string as missing
    if (result === undefined || result === "") {
        if (fallbackObj) {
            const fallback = getNested(fallbackObj, path);
            if (fallback !== undefined && fallback !== "") return fallback;
        }

        logger.warn(`[i18n] Missing or empty key: ${path}, falling back to path`);
        return path;
    }

    return result;
}

function createProxy(path: string[] = []): any {
    return new Proxy({}, {
        get(_target, prop: string) {
            const newPath = [...path, prop];
            const value = getNested(
                _currentLocale ? _loadedStrings[_currentLocale] : {},
                newPath.join("."),
                langDefault
            );

            if (typeof value === "object" && value !== null) {
                return createProxy(newPath);
            }

            // if somehow still empty string, fallback to path
            return value || newPath.join(".");
        }
    });
}

export const Strings = createProxy();

const languageMap: Record<string, string> = {
    "nl-NL": "nl",
    "de-DE": "de",
};

function fetchLocale(locale: string) {
    const resolvedLocale = (_lastSetLocale = languageMap[locale] ?? locale);

    logger.log("[i18n] fetchLocale called:", locale, "->", resolvedLocale);

    if (!_loadedLocale.has(resolvedLocale)) {
        _loadedLocale.add(resolvedLocale);

        // use local defaults for english
        if (resolvedLocale.toLowerCase().startsWith("en")) {
            logger.log("[i18n] Using local default.json for English locale");
            _loadedStrings[resolvedLocale] = langDefault;
            _currentLocale = resolvedLocale;
        } else {
            Promise.all([
                fetch(`https://codeberg.org/raincord/i18n/raw/branch/patch/locales/${resolvedLocale}/general.json`).then(r => r.json()),
                fetch(`https://codeberg.org/raincord/i18n/raw/branch/patch/locales/${resolvedLocale}/plugins.json`).then(r => r.json()),
            ])
                .then(([general, plugins]) => {
                    logger.log("[i18n] Loaded strings for:", resolvedLocale);

                    _loadedStrings[resolvedLocale] = {
                        GENERAL: general,
                        PLUGINS: plugins,
                    };

                    _currentLocale = resolvedLocale;
                })
                .catch(e =>
                    logger.error(`[i18n] Error fetching strings for ${resolvedLocale}: ${e}`),
                );
        }
    } else {
        _currentLocale = resolvedLocale;
    }
}

export function initFetchI18nStrings() {
    let attempts = 0;
    const checkAndFetch = () => {
        attempts++;

        try {
            const LocaleStore = findByStoreName("LocaleStore");
            logger.log("[i18n] Attempt", attempts, "- LocaleStore:", !!LocaleStore);

            // debug log whats in localestore
            // if (LocaleStore) {
            //     logger.log("[i18n] LocaleStore on attempt", attempts, ":", LocaleStore);
            // }

            if (!LocaleStore) {
                logger.log("[i18n] LocaleStore not found yet");
                return false;
            }

            if (LocaleStore?._isInitialized !== true) {
                logger.log("[i18n] LocaleStore not initialized yet");
                return false;
            }

            const locale = LocaleStore.locale;

            if (locale) {
                logger.log("[i18n] Using LocaleStore:", locale);
                fetchLocale(locale);
                return true;
            }

            // return false;

        } catch (e) {
            logger.log("[i18n] Error:", e);
        }
        return false;
    };

    const tryTimes = () => {
        if (checkAndFetch()) return;
        if (attempts < 15) {
            setTimeout(tryTimes, 500);
        }
    };

    tryTimes();

    const cb = (e: any) => {
        // skip if the event is still loading or no locale data yet
        if (e?.settings?.changes?.loading) {
            logger.log("[i18n] Settings loading, skipping...");
            return;
        }

        const locale = e?.settings?.changes?.protoToSave?.localization?.locale?.value;
        logger.log("[i18n] Locale changed:", locale);
        if (locale) {
            logger.log("[i18n] Found locale in event:", locale);
            fetchLocale(locale);
        }
    };

    FluxDispatcher.subscribe("USER_SETTINGS_PROTO_UPDATE_EDIT_INFO", cb);

    return () => {
        FluxDispatcher.unsubscribe("USER_SETTINGS_PROTO_UPDATE_EDIT_INFO", cb);
    };
}
type FormatStringRet<T> = T extends PrimitiveType
  ? string
  : string | T | (string | T)[];

export function formatString<T = void>(
    key: I18nKey,
    val?: Record<string, T>
): FormatStringRet<T> {
    const str = getNested(
        _currentLocale ? _loadedStrings[_currentLocale] : {},
        key,
        langDefault
    );

    try {
        // @ts-ignore
        return new IntlMessageFormat(str).format(val ?? {});
    } catch (e) {
        logger.error(`[i18n] Failed formatting key "${key}":`, e);
        return str || key; // fallback to key if string is empty
    }
}
