export interface Config {
    websocketURL: string;
    accounts:     Account[];
}

export interface Account {
    user:       string;
    password:   string;
    steamGuard: boolean;
}
