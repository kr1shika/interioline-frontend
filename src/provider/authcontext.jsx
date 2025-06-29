import React, { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState("");

    // Load from localStorage on app start
    useEffect(() => {
        const storedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const storedUserId = localStorage.getItem("userId");
        const storedUserRole = localStorage.getItem("userRole");

        if (storedIsLoggedIn && storedUserId && storedUserRole) {
            setIsLoggedIn(true);
            setUserId(storedUserId);
            setUserRole(storedUserRole);
        }
    }, []);

    // Login function
    const login = (id, role) => {
        const lowerCaseRole = typeof role === "string" ? role.toLowerCase() : "";

        setIsLoggedIn(true);
        setUserId(id);
        setUserRole(lowerCaseRole);

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", id);
        localStorage.setItem("userRole", lowerCaseRole);
    };

    // Logout function
    const logout = () => {
        setIsLoggedIn(false);
        setUserId(null);
        setUserRole("");

        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("token"); // optional if you're using token storage
    };

    // Optional admin validation
    const validateAdminSession = () => {
        const token = localStorage.getItem("token");
        const storedUserRole = localStorage.getItem("userRole");

        if (token && storedUserRole === "admin") {
            setIsLoggedIn(true);
            return true;
        } else {
            logout();
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, userId, userRole, login, logout, validateAdminSession }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy use
export const useAuth = () => useContext(AuthContext);
