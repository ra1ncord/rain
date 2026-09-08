export interface APIResponse {
    [index: string]: any;
    success: boolean;
    message: string;
    updated: false;
}

// USER = 0
// SERVER = 1
// ADVERT = 2
// SYSTEM = 3
export type ReviewType = 0 | 1 | 2 | 3;

export interface Review {
    id: number;
    sender: {
        id: number;
        discordID: string;
        username: string;
        profilePhoto: string;
        badges: Badge[];
    },
    star: number;
    comment: string;
    type: ReviewType;
    timestamp: number;
    score?: number;
    userVote?: boolean | null;
}

export interface ReviewVote {
    reviewID: number;
    isUpvote: boolean;
}

export interface ReviewData {
    reviews: Review[];
    reviewCount: number;
}

export interface Badge {
    name: string;
    description: string;
    icon: string;
    redirectURL: string;
    type: number;
    discordID: string;
}
