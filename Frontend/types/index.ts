export interface User {
    uid: string;
    email: string | null;
    displayName?: string | null;
    role?: string;
    [key: string]: any;
}
