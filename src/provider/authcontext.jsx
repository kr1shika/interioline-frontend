import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

const decodeJWTToken = (token) => {
    try {
        if (!token) return null;

        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (error) {
        console.error("❌ Error decoding JWT token:", error);
        return null;
    }
};

const isTokenExpired = (token) => {
    try {
        const payload = decodeJWTToken(token);
        if (!payload || !payload.exp) return true;

        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch (error) {
        return true;
    }
};

const getUserIdFromToken = (token) => {
    const payload = decodeJWTToken(token);
    return payload?.userId || payload?.user_id || payload?.id || null;
};

// Axios interceptor setup
const setupAxiosInterceptors = (logout) => {
    // Request interceptor to add token to headers
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem("token");
            if (token && !isTokenExpired(token)) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor to handle token expiration
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                console.log("🔒 401 Unauthorized - Auto logout");
                logout();
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState("");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔐 Get userId from token (computed property - not stored in state)
    const getUserId = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) return null;

        if (isTokenExpired(token)) {
            console.warn("⚠️ Token expired, userId not available");
            return null;
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            console.warn("⚠️ No userId found in token");
        }

        return userId;
    }, []);

    // 🔐 Computed property for userId
    const userId = getUserId();

    // Enhanced logout function
    const logout = useCallback(() => {
        try {
            // Call logout endpoint to clear HTTP-only cookies (optional)
            axios.post('/api/auth/logout').catch(console.error);
        } catch (error) {
            console.error("Logout API call failed:", error);
        } finally {
            // Clear all localStorage
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userRole");
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Clean up any legacy userId
            localStorage.removeItem("userId");

            // Reset state
            setIsLoggedIn(false);
            setUserRole("");
            setUser(null);

            console.log("✅ Logout complete - all data cleared");
        }
    }, []);

    // Setup axios interceptors
    useEffect(() => {
        setupAxiosInterceptors(logout);
    }, [logout]);

    // 🔐 SECURE LOGIN METHOD - Store token, derive userId from token
    const login = useCallback((id, role, userData = null, token = null) => {
        const lowerCaseRole = typeof role === "string" ? role.toLowerCase() : "";

        // Set in React state
        setIsLoggedIn(true);
        setUserRole(lowerCaseRole);

        // Store only non-sensitive data in localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", lowerCaseRole);

        // Store token (userId will be derived from this)
        if (token) {
            localStorage.setItem("token", token);

            // Verify the token contains userId
            const tokenUserId = getUserIdFromToken(token);
            if (tokenUserId !== id) {
                console.warn("⚠️ Token userId mismatch:", { expected: id, fromToken: tokenUserId });
            }
        }

        // Store additional user data if provided
        if (userData) {
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
        }

        console.log("✅ Secure login successful:", {
            role: lowerCaseRole,
            tokenStored: !!token,
            userIdFromToken: token ? getUserIdFromToken(token) : "No token"
        });
    }, []);

    // 🔐 SECURE INITIALIZATION - Check token validity and extract data
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
                const storedUserRole = localStorage.getItem("userRole");
                const storedUser = localStorage.getItem("user");
                const storedToken = localStorage.getItem("token");

                // Clean up any legacy userId from localStorage
                if (localStorage.getItem("userId")) {
                    console.log("🧹 Removing legacy userId from localStorage");
                    localStorage.removeItem("userId");
                }

                if (storedIsLoggedIn && storedToken) {
                    // Check if token is expired
                    if (isTokenExpired(storedToken)) {
                        console.log("🔒 Token expired, logging out");
                        logout();
                        setLoading(false);
                        return;
                    }

                    // Get userId from token
                    const tokenUserId = getUserIdFromToken(storedToken);
                    if (!tokenUserId) {
                        console.log("❌ No userId in token, logging out");
                        logout();
                        setLoading(false);
                        return;
                    }

                    // Verify token with server (optional but recommended)
                    try {
                        const response = await axios.get('/api/auth/me', {
                            headers: { Authorization: `Bearer ${storedToken}` }
                        });

                        const userData = response.data;

                        // Verify server userId matches token userId
                        if (userData._id !== tokenUserId) {
                            console.warn("⚠️ Server userId doesn't match token userId");
                        }

                        // Set auth data from server response
                        setIsLoggedIn(true);
                        setUserRole(userData.role?.toLowerCase() || storedUserRole);
                        setUser(userData);

                        // Update localStorage with fresh data
                        localStorage.setItem("isLoggedIn", "true");
                        localStorage.setItem("userRole", userData.role?.toLowerCase() || storedUserRole);
                        localStorage.setItem("user", JSON.stringify(userData));

                        console.log("✅ Auth restored from server + token:", {
                            userId: tokenUserId,
                            role: userData.role?.toLowerCase(),
                            method: "Server validation + token decode"
                        });
                    } catch (error) {
                        console.warn("⚠️ Server validation failed, using token only:", error.message);

                        // Server validation failed, but token is valid - continue with token data
                        setIsLoggedIn(true);
                        setUserRole(storedUserRole);

                        if (storedUser) {
                            try {
                                setUser(JSON.parse(storedUser));
                            } catch (e) {
                                console.error("Error parsing stored user data:", e);
                            }
                        }

                        console.log("✅ Auth restored from token only:", {
                            userId: tokenUserId,
                            role: storedUserRole,
                            method: "Token decode only"
                        });
                    }
                } else {
                    console.log("ℹ️ No valid stored auth data found");
                }
            } catch (error) {
                console.error("❌ Error initializing auth:", error);
                logout();
            }

            setLoading(false);
        };

        initializeAuth();
    }, [logout]);

    // Check if user has specific role
    const hasRole = useCallback((role) => {
        return userRole === role.toLowerCase();
    }, [userRole]);

    // Check if user has any of the specified roles
    const hasAnyRole = useCallback((roles) => {
        return roles.some(role => userRole === role.toLowerCase());
    }, [userRole]);

    // Get current auth token
    const getToken = useCallback(() => {
        const token = localStorage.getItem("token");
        if (token && isTokenExpired(token)) {
            console.warn("⚠️ Token expired");
            return null;
        }
        return token;
    }, []);

    // Update user profile data
    const updateUserProfile = useCallback((updatedData) => {
        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        console.log("✅ User profile updated:", updatedData);
    }, [user]);

    // Validate admin session
    const validateAdminSession = useCallback(async () => {
        if (!isLoggedIn || userRole !== "admin") {
            logout();
            return false;
        }

        const token = getToken();
        if (!token) {
            logout();
            return false;
        }

        try {
            await axios.get('/api/auth/validate-admin');
            return true;
        } catch (error) {
            console.error("Admin validation failed:", error);
            logout();
            return false;
        }
    }, [isLoggedIn, userRole, logout, getToken]);

    // Check if userId is available (token exists and is valid)
    const isUserIdAvailable = useCallback(() => {
        const token = localStorage.getItem("token");
        return !!(token && !isTokenExpired(token) && getUserIdFromToken(token));
    }, []);

    // Get token payload for debugging
    const getTokenPayload = useCallback(() => {
        const token = getToken();
        return token ? decodeJWTToken(token) : null;
    }, [getToken]);

    // Debug logging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const token = localStorage.getItem("token");
            console.log("🔍 Auth State:", {
                isLoggedIn,
                userId: userId || "❌ NOT AVAILABLE",
                userRole,
                loading,
                hasUser: !!user,
                tokenExists: !!token,
                tokenExpired: token ? isTokenExpired(token) : "No token",
                tokenPayload: token ? decodeJWTToken(token) : null
            });
        }
    }, [isLoggedIn, userId, userRole, loading, user]);

    const contextValue = {
        // State
        isLoggedIn,
        userId,              // 🔐 Derived from token, never stored
        userRole,
        user,
        loading,

        // Actions
        login,               // 🔐 Stores token, userId derived from it
        logout,

        // Utilities
        getUserId,           // 🔐 Function to get userId from token
        hasRole,
        hasAnyRole,
        getToken,           // 🔐 Gets valid token or null
        validateAdminSession,
        updateUserProfile,
        isUserIdAvailable,  // 🔐 Check if userId can be derived from token
        getTokenPayload     // 🔐 For debugging token content
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy use
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Enhanced HOC for protecting routes
export const withAuth = (WrappedComponent, allowedRoles = []) => {
    return function AuthenticatedComponent(props) {
        const { isLoggedIn, userRole, loading, isUserIdAvailable } = useAuth();

        if (loading) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    fontSize: '16px',
                    color: '#C2805A'
                }}>
                    🔐 Verifying authentication...
                </div>
            );
        }

        if (!isLoggedIn || !isUserIdAvailable()) {
            return (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    fontSize: '16px'
                }}>
                    <h3>🔐 Authentication Required</h3>
                    <p>Please log in to access this page.</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            background: '#C2805A',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Login
                    </button>
                </div>
            );
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
            return (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    fontSize: '16px'
                }}>
                    <h3>🚫 Access Denied</h3>
                    <p>You don't have permission to access this page.</p>
                    <p><strong>Required:</strong> {allowedRoles.join(' or ')}</p>
                    <p><strong>Your role:</strong> {userRole}</p>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
};