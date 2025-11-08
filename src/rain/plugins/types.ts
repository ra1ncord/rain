export interface rainPlugin {
    name: string;
    description: string;
    id: string;
    icon: string;
    version: string;
    author: developer;
    start: () => void;
    stop?: () => void;
}

export interface developer {
    name: string;
    id: bigint;
}