export interface Config {
    remoteURL: string;
    remoteMAC: string;
    accounts: Account[];
}

export interface Account {
    user:       string;
    password:   string;
    steamGuard: boolean;
}
