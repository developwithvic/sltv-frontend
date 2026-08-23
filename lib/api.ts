import axios from "axios";

/**
 * Sanitizes and formats the API base URL.
 * Automatically adds https:// protocol if missing and ensures /api path is present.
 */
const getApiBaseUrl = (): string => {
    let url = (process.env.NEXT_PUBLIC_API_URL || "https://app.ezyvtu.com.ng/api/v1").trim();

    // Ensure the URL includes a protocol (http:// or https://)
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }

    // Strip any trailing slashes
    url = url.replace(/\/+$/, "");

    // If the base URL is just a domain without an /api path, append /api/v1
    if (!url.includes("/api")) {
        url = `${url}/api/v1`;
    }

    return url;
};

// Create an Axios instance with default configuration
const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            // Check if we are in admin section or making admin API call
            const isAdminRequest = config.url?.includes("/admin") || window.location.pathname.startsWith("/admin");
            const token = isAdminRequest ? localStorage.getItem("admin_token") : localStorage.getItem("token");

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized and 403 Forbidden errors (e.g., redirect to login)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            if (typeof window !== "undefined") {
                const isAdminRoute = window.location.pathname.startsWith("/admin");
                const loginPath = isAdminRoute ? "/admin/login" : "/login";

                // Only redirect if not already on the login page to avoid loops
                if (!window.location.pathname.startsWith(loginPath)) {
                    // Clear appropriate token
                    if (isAdminRoute) {
                        localStorage.removeItem("admin_token");
                    } else {
                        localStorage.removeItem("token");
                    }
                    window.location.href = loginPath;
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
