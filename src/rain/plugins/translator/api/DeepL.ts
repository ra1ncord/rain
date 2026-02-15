import { DeepLResponse } from "../type"

// TODO: Change API link when it'll be down
const API_URL = "https://deeplx.mingming.dev/translate"

const translate = async (text: string, source_lang: string = "auto", target_lang: string, original: boolean = false) => {
    try {
        if (original) return { source_lang, text }
        const data: DeepLResponse = await (await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text,
                source_lang,
                target_lang
            })
        })).json()
        if (data.code !== 200) throw Error(`Failed to translate text from DeepL: ${data.message}`)
        return { source_lang, text: data.data }
    } catch (e) {
        throw Error(`Failed to fetch from DeepL: ${e}`)
    }
}

export default { translate }


