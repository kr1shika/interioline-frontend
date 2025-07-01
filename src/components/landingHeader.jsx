import { Link } from "react-router-dom";
import { useAuth } from "../provider/authcontext";
import ChatIconWithWidget from "./chatIcon";
import "./landingHeader.css";
import NotificationComponent from "./notification";
import ProfileMenu from "./ProfileMenu";

const LandingHeader = ({ onGetStartedClick }) => {
    const { isLoggedIn, userId, loading, isUserIdAvailable } = useAuth();

    // Show loading state while auth is being determined
    if (loading) {
        return (
            <div className="landnavbar">
                <div className="landnavbar-left landnavbar-title">
                    <Link to="/Home">
                        <span>InterioLine</span>
                    </Link>
                </div>
                <div className="landnavbar-right">
                    <div style={{
                        color: '#C2805A',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px'
                    }}>
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="landnavbar">
            <div className="landnavbar-left landnavbar-title">
                <Link to="/Home">
                    <span>InterioLine</span>
                </Link>
            </div>

            {isLoggedIn && isUserIdAvailable() ? (
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

export default LandingHeader;