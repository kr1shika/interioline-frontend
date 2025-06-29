import { Link } from "react-router-dom";
import { useAuth } from "../provider/authcontext";
import ChatIconWithWidget from "./chatIcon";
import "./landingHeader.css";
import NotificationComponent from "./notification";
import ProfileMenu from "./ProfileMenu";

const landingHeader = ({ onGetStartedClick }) => {
    const { isLoggedIn } = useAuth();
    const userId = localStorage.getItem('userId');

    return (
        <div className="landnavbar">
            <div className="landnavbar-left landnavbar-title">
                <Link to="/Home">
                    <span>InterioLine</span>
                </Link>
            </div>

            {isLoggedIn ? (
                <div className="landnavbar-right">
                    <Link to="/about" className="landnav-link">
                        About
                    </Link>
                    <NotificationComponent userId={userId} />
                    <ChatIconWithWidget />
                    <ProfileMenu />
                </div>
            ) : (
                <div className="landnavbar-right">
                    <Link to="/about" className="landnav-link">
                        About
                    </Link>
                    <button
                        onClick={onGetStartedClick}
                        className="landnav-link start-now-button"
                    >
                        Start Now
                    </button>
                </div>
            )}
        </div>
    );
};

export default landingHeader;