import { FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../provider/authcontext";
import ChatIconWithWidget from "./chatIcon";
import "./Headerr.css";
import ProfileMenu from "./ProfileMenu";

const Header = ({ onGetStartedClick }) => {
    const { isLoggedIn } = useAuth();
    return (
        <div className="navbar">
            <div className="navbar-left navbar-title">
                <Link to="/Home">
                    <span>InterioLine</span>
                </Link>
            </div>
            {isLoggedIn ? (
                <div className="navbar-right">
                    <button className="icon-button notification-container" title="Notifications">
                        <FaBell className="navicon" />
                        <span className="notification-dot"></span>
                    </button>
                    <ChatIconWithWidget />
                    <ProfileMenu />
                </div>
            ) : (
                <div className="navbar-right">
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                    />
                    <button
                        onClick={onGetStartedClick}
                        className="get-started-button"
                    >
                        Get Started
                    </button>
                </div>
            )}
        </div>
    );
};

export default Header;
