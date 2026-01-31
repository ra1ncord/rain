import { Review } from "../def";
import { reviewdbSettings } from "../storage";
import { BASE_URL, API_URL } from "./constants";
import { jsonFetch } from "./utils";

export const getReviews = async (userId: string): Promise<Review[]> =>
    (await jsonFetch(API_URL + `/users/${userId}/reviews`)).reviews;

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

export const getCurrentUser = async () =>
    await jsonFetch(API_URL + "/users", {
        method: "POST",
        body: JSON.stringify({
            token: reviewdbSettings.authToken,
        }),
    });
