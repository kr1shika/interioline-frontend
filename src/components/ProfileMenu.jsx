import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import defaultProfile from "../assets/images/ham.jpg";
import { useAuth } from "../provider/authcontext";

const ProfileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { logout, userRole } = useAuth();
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

    const handleLogout = () => {
        logout();
        navigate("/");
    };

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
                src={defaultProfile}
                alt="Profile"
                style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    objectFit: "cover"
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
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        zIndex: 1000
                    }}
                >
                    <ul style={{
                        listStyle: "none",
                        margin: 0,
                        padding: "8px 0",
                        minWidth: "150px"
                    }}>
                        <li
                            style={menuItemStyle}
                            onClick={() => navigate("/my-projects")}
                        >
                            My Projects
                        </li>
                        <li
                            style={menuItemStyle}
                            onClick={() =>
                                navigate(userRole === "designer" ? "/designer-profile" : "/account-settings")
                            }
                        >
                            {userRole === "designer" ? "My Profile" : "Account Settings"}
                        </li>
                        <li
                            style={menuItemStyle}
                            onClick={handleLogout}
                        >
                            Logout
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

const menuItemStyle = {
    padding: "8px 12px",
    cursor: "pointer",
    whiteSpace: "nowrap"
};

export default ProfileMenu;
