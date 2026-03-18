import { findByName, findByProps } from "@metro";
import { Strings } from "@rain/i18n";

import { AUTHORIZE_URL,CLIENT_ID } from "../constants";
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
                clientId: CLIENT_ID,
                redirectUri: AUTHORIZE_URL,
                scopes: ["identify"],
                responseType: "code",
                permissions: 0n,
                cancelCompletesFlow: false,
                callback: async ({ location }) => {
                    const url = new URL(location);
                    // We use i18n for the client because it doesnt change across translations and it makes it better for people who make bad forks and wont change it :P
                    url.searchParams.append("client", Strings.GENERAL.CORE.RAIN);

                    const req = await fetch(url);

                    if (req?.ok) {
                        const ResponseText = await req.text();
                        useAuthorizationStore.getState().setToken(ResponseText);

                    } else {
                        popModal("oauth2-authorize");
                    }
                },
                dismissOAuthModal: () => popModal("oauth2-authorize")
            },
            closable: true
        }
    });
