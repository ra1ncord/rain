export type AnimalImageSource = {
    id: string;
    label: string;
    description: string;
    getImageUrl: () => Promise<string>;
};

export type AnimalSource = {
    id: string;
    name: string;
    description: string;
    sources: AnimalImageSource[];
};

const json = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

const imageExtensionRegex = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i;

const extractUrl = (value: unknown): string | null => {
    if (typeof value === "string") {
        if (value.startsWith("http://") || value.startsWith("https://")) return value;
        if (value.startsWith("/")) return value;
        return null;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = extractUrl(item);
            if (found) return found;
        }
        return null;
    }

    if (value && typeof value === "object") {
        for (const item of Object.values(value)) {
            const found = extractUrl(item);
            if (found) return found;
        }
    }

    return null;
};

const extractImageUrlFromHtml = (html: string, baseUrl: string): string | null => {
    const ogMatch =
        html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    const imgMatch =
        html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i) ||
        html.match(/<img[^>]*data-src=["']([^"']+)["'][^>]*>/i);

    const raw = (ogMatch && ogMatch[1]) || (imgMatch && imgMatch[1]) || null;
    if (!raw) return null;

    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;
    if (raw.startsWith("/")) {
        const origin = baseUrl.split("/").slice(0, 3).join("/");
        return `${origin}${raw}`;
    }
    return raw;
};

const fetchImageUrlFromEndpoint = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers?.get?.("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        if (!contentType.includes("image/")) {
            if (contentType.includes("text/html")) {
                const html = await res.text();
                const found = extractImageUrlFromHtml(html, url);
                if (found) return found;
            } else {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    const found = extractUrl(data);
                    if (found) return found.startsWith("/")
                        ? `${url.split("/").slice(0, 3).join("/")}${found}`
                        : found;
                } catch {

                }
            }
            throw new Error(`Unexpected content type: ${contentType}`);
        }
        return res.url ?? url;
    }

    const data = await res.json();
    const found = extractUrl(data);
    if (!found) throw new Error("No image URL found in response");
    if (found.startsWith("/")) {
        const origin = url.split("/").slice(0, 3).join("/");
        return `${origin}${found}`;
    }
    return found;
};

export const ensureImageUrl = async (url: string) => {
    if (imageExtensionRegex.test(url)) return url;
    return fetchImageUrlFromEndpoint(url);
};

const fetchFromTinyFoxOtter = async () => {
    try {
        const data = await json("https://api.tinyfox.dev/img.json?animal=ott");
        const loc = data?.loc || data?.url || data?.image;
        if (typeof loc === "string" && loc) {
            if (loc.startsWith("http://") || loc.startsWith("https://")) return loc;
            if (loc.startsWith("/")) return `https://tinyfox.dev${loc}`;
        }
    } catch {

    }

    return fetchImageUrlFromEndpoint("https://api.tinyfox.dev/img?animal=ott");
};

export const sources: AnimalSource[] = [
    {
        id: "dog",
        name: "dog",
        description: "Send a random dog image",
        sources: [
            {
                id: "dog-ceo",
                label: "Dog CEO",
                description: "dog.ceo",
                getImageUrl: async () => {
                    const data = await json("https://dog.ceo/api/breeds/image/random");
                    if (!data?.message) throw new Error("Invalid response");
                    return data.message;
                },
            },
        ],
    },
    {
        id: "cat",
        name: "cat",
        description: "Send a random cat image",
        sources: [
            {
                id: "thecatapi",
                label: "TheCatAPI",
                description: "thecatapi.com",
                getImageUrl: async () => {
                    const data = await json("https://api.thecatapi.com/v1/images/search?limit=1");
                    const url = data?.[0]?.url;
                    if (!url) throw new Error("Invalid response");
                    return url;
                },
            },
        ],
    },
    {
        id: "fox",
        name: "fox",
        description: "Send a random fox image",
        sources: [
            {
                id: "randomfox",
                label: "RandomFox",
                description: "randomfox.ca",
                getImageUrl: async () => {
                    const data = await json("https://randomfox.ca/floof/");
                    if (!data?.image) throw new Error("Invalid response");
                    return data.image;
                },
            },
        ],
    },
    {
        id: "duck",
        name: "duck",
        description: "Send a random duck image",
        sources: [
            {
                id: "random-duck",
                label: "Random-D",
                description: "random-d.uk",
                getImageUrl: async () => {
                    const data = await json("https://random-d.uk/api/v2/random");
                    if (!data?.url) throw new Error("Invalid response");
                    return data.url;
                },
            },
        ],
    },
    {
        id: "otter",
        name: "otter",
        description: "Send a random otter image",
        sources: [
            {
                id: "tinyfox",
                label: "TinyFox",
                description: "tinyfox.dev",
                getImageUrl: fetchFromTinyFoxOtter,
            },
        ],
    },
];
