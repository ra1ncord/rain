import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { findByName, findByProps } from "@metro";
import { getClientId, getRedirectUrl } from "../constants";
import { useAuthorizationStore } from "../stores/AuthorizationStore";

const { pushModal, popModal } = findByProps("pushModal");
const OAuth2AuthorizeModal = findByName("OAuth2AuthorizeModal");

export default () =>
    pushModal({
        key: "oauth2-authorize",
        modal: {
            key: "oauth2-authorize",
            modal: OAuth2AuthorizeModal,
            animation: "slide-up",
            shouldPersistUnderModals: false,
            props: {
                clientId: getClientId(),
                redirectUri: getRedirectUrl(),
                scopes: ["identify"],
                responseType: "code",
                permissions: 0n,
                cancelCompletesFlow: false,
                callback: async ({ location }: any) => {
                    try {
                        const url = new URL(location);
                        const code = url.searchParams.get("code");
                        
                        if (!code) {
                            throw new Error("No code found in redirect URL");
                        }

                        // The cloud-sync server expects the code to be sent to its auth endpoint
                        // to exchange it for a token.
                        const authUrl = new URL(getRedirectUrl());
                        authUrl.searchParams.append("code", code);

                        const res = await fetch(authUrl.toString(), {
                            headers: {
                                "Accept": "application/json",
                            },
                        });

                        const text = await res.text();
                        
                        if (!res.ok) {
                            throw new Error(`Server error (${res.status}): ${text}`);
                        }

                        let token: string | undefined;
                        
                        // Try to parse as JSON first
                        try {
                            const json = JSON.parse(text);
                            token = json.token;
                        } catch (e) {
                            // If not JSON, check if the raw text looks like a JWT
                            if (text.startsWith("eyJ") && text.includes(".")) {
                                token = text.trim();
                            }
                        }

                        if (token) {
                            useAuthorizationStore.getState().setToken(token);
                            showToast("Successfully authorized!", findAssetId("CheckIcon"));
                            popModal("oauth2-authorize");
                        } else {
                            throw new Error(`No token found in server response: ${text.slice(0, 100)}...`);
                        }
                    } catch (e) {
                        showToast("Authorization failed!", findAssetId("CircleXIcon"));
                        logger.error("[CloudSync] Authorization failed", e);
                        popModal("oauth2-authorize");
                    }
                },
                dismissOAuthModal: () => popModal("oauth2-authorize"),
            },
            closable: true,
        },
    });
