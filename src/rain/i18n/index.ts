// TODO:
// - change the pull URL
// - remove useless logging
// - refactor for everything, its a total mess
import { FluxDispatcher } from "@metro/common";
import { findByNameLazy, findByProps } from "@metro/wrappers";
import { PrimitiveType } from "intl-messageformat";
import { logger } from "@lib/utils/logger";

import langDefault from "./default.json";

const IntlMessageFormat = findByNameLazy(
  "MessageFormat",
) as typeof import("intl-messageformat").default;

type I18nKey = keyof typeof langDefault;

let _currentLocale: string | null = null;
let _lastSetLocale: string | null = null;

const _loadedLocale = new Set<string>();
const _loadedStrings = {} as Record<string, typeof langDefault>;

export const Strings = new Proxy(
  {},
  {
    get: (_t, prop: keyof typeof langDefault) => {
      if (_currentLocale && _loadedStrings[_currentLocale]?.[prop]) {
        return _loadedStrings[_currentLocale]?.[prop];
      }
      return langDefault[prop];
    },
  },
) as Record<I18nKey, string>;

// this is broken as hell, how en-PL??????????? But it somehow works
const languageMap: Record<string, string> = {
    "en-PL": "pl",
    "es-ES": "es",
    "es-419": "es_419",
    "zh-TW": "zh-Hant",
    "zh-CN": "zh-Hans",
    "pt-PT": "pt",
    "pt-BR": "pt_BR",
    "sv-SE": "sv",
};

function fetchLocale(locale: string) {
    const resolvedLocale = (_lastSetLocale = languageMap[locale] ?? locale);

    logger.log("[i18n] fetchLocale called:", locale, "->", resolvedLocale);

    // don't ask me. It was worse before
    if (!_loadedLocale.has(resolvedLocale)) {
      _loadedLocale.add(resolvedLocale);

      logger.log("[i18n] Fetching from:", `https://cdn.kmmiio99o.dev/${resolvedLocale}.json`);

      // todo: change URL at the end of testing, temp thing (only Polish was done)
      fetch(
        `https://cdn.kmmiio99o.dev/${resolvedLocale}.json`,
      )
        .then((r) => {
            logger.log("[i18n] Response status:", r.status);
            return r.json();
        })
        .then((strings) => {
            logger.log("[i18n] Loaded strings for:", resolvedLocale);
            _loadedStrings[resolvedLocale] = strings;
        })
        .then(
          () =>
            resolvedLocale === _lastSetLocale &&
            (_currentLocale = resolvedLocale),
        )
        .catch((e) =>
          logger.error(
            `[i18n] Error fetching strings for ${resolvedLocale}: ${e}`,
          ),
        );
    } else {
      _currentLocale = resolvedLocale;
    }
  }

export function initFetchI18nStrings() {
  let attempts = 0;
  const checkAndFetch = () => {
      attempts++;

      try {
          const intlModule = findByProps("intl");
          logger.log("[i18n] Attempt", attempts, "- intlModule:", !!intlModule);

          if (!intlModule) return false;

let locale = intlModule?.systemLocale;
          logger.log("[i18n] systemLocale (device):", locale);

          if (!locale) {
              locale = intlModule?.intl?.systemLocale;
              logger.log("[i18n] intl.systemLocale:", locale);
          }

          if (!locale) {
              locale = intlModule?.initialLocale;
              logger.log("[i18n] initialLocale (Discord):", locale);
          }

          if (!locale) {
              locale = intlModule?.intl?.initialLocale;
              logger.log("[i18n] intl.initialLocale:", locale);
          }

          if (!locale) return false;

          logger.log("[i18n] Using locale:", locale);
          fetchLocale(locale);
          return true;

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

  const cb = (data: any) => {
    logger.log("[i18n] Flux event:", data?.type, data);
    if (data?.locale) {
      logger.log("[i18n] Found locale in event:", data.locale);
      fetchLocale(data.locale);
    }
  };

  FluxDispatcher.subscribe("I18N_LOAD_SUCCESS", cb);
  FluxDispatcher.subscribe("I18N_LOADED", cb);

  return () => {
    FluxDispatcher.unsubscribe("I18N_LOAD_SUCCESS", cb);
    FluxDispatcher.unsubscribe("I18N_LOADED", cb);
  };
}
type FormatStringRet<T> = T extends PrimitiveType
  ? string
  : string | T | (string | T)[];

export function formatString<T = void>(
  key: I18nKey,
  val: Record<string, T>,
): FormatStringRet<T> {
  const str = Strings[key];
  // @ts-ignore
  return new IntlMessageFormat(str).format(val);
}
