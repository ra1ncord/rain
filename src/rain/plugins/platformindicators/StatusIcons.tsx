import { findByStoreName } from "@metro";

import { getStatusColor } from "./colors";
import StatusIcon from "./StatusIcon";
import { usePlatformIndicatorSettings } from "./storage";

const PresenceStore = findByStoreName("PresenceStore");
const SessionsStore = findByStoreName("SessionsStore");
const UserStore = findByStoreName("UserStore");


let statusCache: any;
let statusCacheHits = 0;
let statusCacheTimeout: NodeJS.Timeout | null | number;
let currentUserId: string | null;

function queryPresenceStoreWithCache(){
    if(!statusCacheTimeout){
        statusCacheTimeout = setTimeout(() => {
            statusCacheHits = 0;
            statusCacheTimeout = null;
        },5000);
    }

    if(!statusCache || statusCacheHits === 0){
        statusCache = PresenceStore.getState();
    }

    statusCacheHits = (statusCacheHits+1) % 20;

    return statusCache;
}

function getUserStatuses(userId: string): Record<string, string> | undefined {
    let statuses: Record<string, string> | undefined;

    if(!currentUserId){
        currentUserId = UserStore.getCurrentUser()?.id;
    }

    if(userId === currentUserId){
        const sessions = SessionsStore.getSessions() as Record<string, { clientInfo: { client: string }, status: string }>;
        statuses = Object.values(sessions).reduce<Record<string, string>>((acc, curr) => {
            if (curr.clientInfo.client !== "unknown")
                acc[curr.clientInfo.client] = curr.status;
            return acc;
        }, {} as Record<string, string>);
    } else {
        statuses = queryPresenceStoreWithCache()?.clientStatuses[userId];
    }
    return statuses;
}

export default function StatusIcons(props: { userId: string; size?: number }) {
    const settings = usePlatformIndicatorSettings();

    const userId = props.userId;

    const iconSize = props.size ?? 16;

    const statuses = getUserStatuses(userId);

    return (
        <>
            {Object.entries(statuses ?? {}).map(([platform, status]) =>
                <StatusIcon platform={platform} color={getStatusColor(status, settings.useThemeColors)} iconSize={iconSize}/>)}
        </>
    );
}
