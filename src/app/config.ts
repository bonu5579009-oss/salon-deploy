const getBaseUrl = () => {
    // Priority 1: Environment variable
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    // Priority 2: Current domain (for monolithic deployments)
    if (typeof window !== "undefined") return window.location.origin;
    // Fallback for local development
    return "http://localhost:10000";
};

export const API_URL = getBaseUrl().replace(/\/$/, "");

const getWsUrl = () => {
    const base = API_URL;
    const protocol = base.startsWith("https") ? "wss:" : "ws:";
    return base.replace(/^https?/, protocol).replace(/\/$/, "") + "/ws/queue";
};

export const WS_URL = getWsUrl();
