export interface DeepLResponse {
    alternatives?: string[]
    code?: number
    message?: string
    data?: string
    id?: number
}
export interface GTranslateResponse {
    src?: string;
    sentences?: {
        trans: string;
    }[];
}