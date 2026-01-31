export interface Message {
	content: string;
	// TODO: Get the proper type for this
	invalidEmojis: any[];
}

export declare enum EmbedType {
	Article = "article",
	Image = "image",
	Video = "video",
	Tweet = "tweet",
	Link = "link",
	HTML = "html",
	File = "file",
	GIFV = "gifv",
	Rich = "rich",
	Text = "text",
	ApplicationNews = "application_news",
	Unknown = "unknown",
}

export interface Embed {
	type: EmbedType;
	url?: string;
}
