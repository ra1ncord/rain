import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import safeFetch from "@lib/utils/safeFetch";
import { React } from "@metro/common";

export interface CommitUser {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    type: string;
}

export interface CommitObj {
    sha: string;
    commit: {
        author: { name: string; email: string; date: string };
        committer: { name: string; email: string; date: string };
        message: string;
    };
    html_url: string;
    author?: CommitUser;
    committer?: CommitUser;
    parents: { sha: string; url: string; html_url: string }[];
}

const revalidateTimeout = 5000;
const refetchTimeout = 15 * 6000;

const commitsSymbol = Symbol.for("monettheme.cache.commits");

let data = {
    canRefetch: 0,
    commits: null,
} as {
    canRefetch: number;
    commits: CommitObj[] | null;
};

if (
    !Number.isNaN((window as any)[commitsSymbol]?.canRefetch)
    && Array.isArray((window as any)[commitsSymbol]?.commits)
) {
    data = {
        canRefetch: (window as any)[commitsSymbol].canRefetch,
        commits: JSON.parse(JSON.stringify((window as any)[commitsSymbol].commits)),
    };
}

(window as any)[commitsSymbol] = data;

const uponRevalidate = new Set<(data: any) => void>();
let canRevalidate = 0;

const refetch = async () => {
    const commits = await safeFetch(
        "https://api.github.com/repos/nexpid/VendettaMonetTheme/commits?path=patches.jsonc",
        { cache: "no-store" },
    )
        .then(x =>
            x.json().catch((err: any) => {
                showToast("Failed to parse GitHub commits!", findAssetId("CircleXIcon-primary"));
                console.error("useCommits refetch error (parse)", err);
                return null;
            }),
        )
        .catch((err: any) => {
            showToast("Failed to fetch GitHub commits!", findAssetId("CircleXIcon-primary"));
            console.error("useCommits refetch error (fetch)", err);
            return null;
        });

    data.commits = commits;
    data.canRefetch = Date.now() + refetchTimeout;

    for (const fnc of uponRevalidate) fnc(commits);
};

const useCommits = (() => {
    const [commits, setCommits] = React.useState(data.commits);
    const revalFunc = (data: any) => setCommits(data);

    React.useEffect(() => {
        uponRevalidate.add(revalFunc);
        return () => void uponRevalidate.delete(revalFunc);
    });

    React.useEffect(
        () => void ((!commits || data.canRefetch >= Date.now()) && refetch()),
        [],
    );

    return {
        commits,
        revalidate: async () => {
            if (canRevalidate < Date.now()) return;
            canRevalidate = Number.NaN;

            await refetch();
            canRevalidate = Date.now() + revalidateTimeout;
        },
    };
}) as {
    (): { commits: CommitObj[] | null; revalidate: () => Promise<void> };
    commits: Promise<CommitObj[] | null> | CommitObj[] | null;
};

Object.defineProperty(useCommits, "commits", {
    get: () => !data.commits ? refetch().then(() => data.commits) : data.commits,
});

export default useCommits;
