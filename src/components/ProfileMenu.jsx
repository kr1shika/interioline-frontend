// import { useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import defaultProfile from "../assets/images/ham.jpg";
// import { useAuth } from "../provider/authcontext";

// const ProfileMenu = () => {
//     const [isOpen, setIsOpen] = useState(false);
//     const { logout, userRole } = useAuth();
//     const navigate = useNavigate();

//     const hoverTimeout = useRef(null);

//     const handleMouseEnter = () => {
//         clearTimeout(hoverTimeout.current);
//         setIsOpen(true);
//     };

//     const handleMouseLeave = () => {
//         hoverTimeout.current = setTimeout(() => {
//             setIsOpen(false);
//         }, 200);
//     };

//     const handleLogout = () => {
//         logout();
//         navigate("/");
//     };

//     return (
//         <div
//             style={{
//                 position: "relative",
//                 display: "inline-block",
//                 cursor: "pointer"
//             }}
//             onMouseEnter={handleMouseEnter}
//             onMouseLeave={handleMouseLeave}
//         >
//             <img
//                 src={defaultProfile}
//                 alt="Profile"
//                 style={{
//                     width: "32px",
//                     height: "32px",
//                     borderRadius: "50%",
//                     objectFit: "cover"
//                 }}
//             />

//             {isOpen && (
//                 <div
//                     style={{
//                         position: "absolute",
//                         right: 0,
//                         top: "40px",
//                         backgroundColor: "#fff",
//                         border: "1px solid #ccc",
//                         borderRadius: "4px",
//                         boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//                         zIndex: 1000
//                     }}
//                 >
//                     <ul style={{
//                         listStyle: "none",
//                         margin: 0,
//                         padding: "8px 0",
//                         minWidth: "150px"
//                     }}>
//                         <li
//                             style={menuItemStyle}
//                             onClick={() => navigate("/my-projects")}
//                         >
//                             My Projects
//                         </li>
//                         <li
//                             style={menuItemStyle}
//                             onClick={() =>
//                                 navigate(userRole === "designer" ? "/designer-profile" : "/account-settings")
//                             }
//                         >
//                             {userRole === "designer" ? "My Profile" : "Account Settings"}
//                         </li>
//                         <li
//                             style={menuItemStyle}
//                             onClick={handleLogout}
//                         >
//                             Logout
//                         </li>
//                     </ul>
//                 </div>
//             )}
//         </div>
//     );
// };

// const menuItemStyle = {
//     padding: "8px 12px",
//     cursor: "pointer",
//     whiteSpace: "nowrap"
// };

// export default ProfileMenu;


import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import defaultProfile from "../assets/images/ham.jpg";
import { useAuth } from "../provider/authcontext";

const ProfileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { logout, userRole, user, userId } = useAuth();
    const navigate = useNavigate();

    const hoverTimeout = useRef(null);

    const handleMouseEnter = () => {
        clearTimeout(hoverTimeout.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsOpen(false);
        }, 200);
    };

    const handleLogout = async () => {
        try {
            // Call logout to clear auth state and tokens
            logout();
            setIsOpen(false);
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
            // Still navigate to home even if logout API fails
            navigate("/");
        }
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        if (userRole === "designer") {
            navigate("/designer-profile");
        } else {
            navigate("/account-settings");
        }
    };

    const handleProjectsClick = () => {
        setIsOpen(false);
        navigate("/my-projects");
    };

    // Get profile picture from user data or use default
    const profilePicture = user?.profile_picture
        ? `http://localhost:2005${user.profile_picture}`
        : user?.profilepic
            ? `http://localhost:2005${user.profilepic}`
            : defaultProfile;

    return (
        <div
            style={{
                position: "relative",
                display: "inline-block",
                cursor: "pointer"
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <img
                src={profilePicture}
                alt="Profile"
                style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #C2805A"
                }}
                onError={(e) => {
                    // Fallback to default image if profile picture fails to load
                    e.target.src = defaultProfile;
                }}
            />

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "40px",
                        backgroundColor: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        minWidth: "180px",
                        overflow: "hidden"
                    }}
                >
                    {/* User Info Header */}
                    <div style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderBottom: "1px solid #e9ecef"
                    }}>
                        <div style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#333",
                            marginBottom: "2px"
                        }}>
                            {user?.full_name || 'User'}
                        </div>
                        <div style={{
                            fontSize: "12px",
                            color: "#666",
                            textTransform: "capitalize"
                        }}>
                            {userRole || 'User'}
                        </div>
                        {userId && (
                            <div style={{
                                fontSize: "10px",
                                color: "#999",
                                fontFamily: "monospace",
                                marginTop: "2px"
                            }}>
                                ID: {userId.substring(0, 8)}...
                            </div>
                        )}
                    </div>

                    <ul style={{
                        listStyle: "none",
                        margin: 0,
                        padding: "8px 0"
                    }}>
                        <li
                            style={menuItemStyle}
                            onClick={handleProjectsClick}
                            onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                        >
                            📋 My Projects
                        </li>
                        <li
                            style={menuItemStyle}
                            onClick={handleProfileClick}
                            onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                        >
                            {userRole === "designer" ? "👤 My Profile" : "⚙️ Account Settings"}
                        </li>
                        <li style={{
                            height: "1px",
                            backgroundColor: "#e9ecef",
                            margin: "8px 0"
                        }} />
                        <li
                            style={{
                                ...menuItemStyle,
                                color: "#dc3545"
                            }}
                            onClick={handleLogout}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#fff5f5";
                                e.target.style.color = "#dc3545";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.color = "#dc3545";
                            }}
                        >
                            🚪 Logout
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

const menuItemStyle = {
    padding: "10px 16px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontSize: "14px",
    color: "#333",
    transition: "background-color 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px"
};

export default ProfileMenu;