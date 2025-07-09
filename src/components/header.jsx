import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../provider/authcontext";
import ChatIconWithWidget from "./chatIcon";
import "./Headerr.css";
import NotificationComponent from "./notification";
import ProfileMenu from "./ProfileMenu";
import { Home, HelpCircle, FolderOpen } from 'lucide-react';

const Header = ({ onGetStartedClick }) => {
    const { isLoggedIn, loading, userId } = useAuth();
    const location = useLocation();

    // Show loading state while auth is being determined
    if (loading) {
        return (
            <div className="navbar">
                <div className="navbar-left">
                    <div className="logo">
                        <div className="logo-icon">
                            <Home size={20} />
                        </div>
                        <Link to="/Home" className="logo-text">
                            InterioLine
                        </Link>
                    </div>
                </div>
                <div className="navbar-right">
                    <div className="loading-text">
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="navbar">
            <div className="navbar-left">
                <div className="logo">
                    <div className="logo-icon">
                        <Home size={20} />
                    </div>
                    <Link to="/Home" className="logo-text">
                        InterioLine
                    </Link>
                </div>
                
                <nav className="nav">
                    <Link 
                        to="/help-center" 
                        className={`nav-item ${location.pathname === '/help-center' ? 'active' : ''}`}
                    >
                        <HelpCircle size={16} />
                        Help Center
                    </Link>
                    <Link 
                        to="/projects" 
                        className={`nav-item ${location.pathname === '/projects' ? 'active' : ''}`}
                    >
                        <FolderOpen size={16} />
                        Projects
                    </Link>
                </nav>
            </div>

            {isLoggedIn ? (
                <div className="navbar-right">
                    <NotificationComponent userId={userId} />
                    <ChatIconWithWidget />
                    <ProfileMenu />
                </div>
            ) : (
                <div className="navbar-right">
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