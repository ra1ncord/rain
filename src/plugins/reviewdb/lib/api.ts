import { ReviewData, ReviewsResponse, ReviewVotesResponse } from "../def";
import { reviewdbSettings } from "../storage";
import { API_URL,BASE_URL } from "./constants";
import { jsonFetch } from "./utils";

export const getReviews = async (userId: string): Promise<ReviewData> => {
    const token = reviewdbSettings.authToken;
    const [data, votes] = await Promise.all([
        jsonFetch<ReviewsResponse>(API_URL + `/users/${userId}/reviews`),
        token
            ? jsonFetch<ReviewVotesResponse>(API_URL + `/users/${userId}/reviews/votes`, {
                headers: { Authorization: token },
            }).catch(() => ({ votes: [] }))
            : Promise.resolve({ votes: [] }),
    ]);

    const voteByReviewId = new Map(
        (votes.votes ?? []).map(vote => [vote.reviewID, vote.isUpvote]),
    );

    return {
        reviews: data.reviews.map(review => ({
            ...review,
            userVote: voteByReviewId.get(review.id) ?? null,
        })),
        reviewCount: data.reviewCount ?? 0,
    };
};

export const getAdmins = async () =>
    await jsonFetch<string[]>(BASE_URL + "/admins");

export const addReview = async (userId: string, comment: string) =>
    await jsonFetch(API_URL + `/users/${userId}/reviews`, {
        method: "PUT",
        body: JSON.stringify({
            comment: comment,
            token: reviewdbSettings.authToken,
        }),
    });

export const deleteReview = async (userId: string, id: number) =>
    await jsonFetch(API_URL + `/users/${userId}/reviews`, {
        method: "DELETE",
        body: JSON.stringify({
            reviewid: id,
            token: reviewdbSettings.authToken,
        }),
    });

export const reportReview = async (id: number) =>
    await jsonFetch(API_URL + "/reports", {
        method: "PUT",
        body: JSON.stringify({
            reviewid: id,
            token: reviewdbSettings.authToken,
        }),
    });

export const voteReview = async (id: number, isUpvote: boolean) =>
    await jsonFetch(API_URL + `/reviews/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({
            isUpvote,
            token: reviewdbSettings.authToken,
        }),
        headers: { Authorization: reviewdbSettings.authToken },
    });

export const deleteReviewVote = async (id: number) =>
    await jsonFetch(API_URL + `/reviews/${id}/vote`, {
        method: "DELETE",
        body: JSON.stringify({
            token: reviewdbSettings.authToken,
        }),
        headers: { Authorization: reviewdbSettings.authToken },
    });

export const getCurrentUser = async () =>
    await jsonFetch(API_URL + "/users", {
        method: "POST",
        body: JSON.stringify({
            token: reviewdbSettings.authToken,
        }),
    });
