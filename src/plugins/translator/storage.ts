import { createPluginStore } from "@api/storage";

export interface DeepLResponse {
    alternatives?: string[];
    code?: number;
    message?: string;
    data?: string;
    id?: number;
}

export interface GTranslateResponse {
    src?: string;
    sentences?: {
        trans: string;
    }[];
}

export interface TranslatorSettings {
    source_lang: string;
    target_lang: string;
    translator: number;
    immersive_enabled: boolean;
}

export const {
    useStore: useTranslatorSettings,
    settings: translatorSettings,
} = createPluginStore<TranslatorSettings>("translator", {
    source_lang: "auto",
    target_lang: "en",
    translator: 1,
    immersive_enabled: true,
});
