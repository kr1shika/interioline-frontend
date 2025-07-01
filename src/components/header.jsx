// import { FaBell } from "react-icons/fa";
// import { Link } from "react-router-dom";
// import { useAuth } from "../provider/authcontext";
// import ChatIconWithWidget from "./chatIcon";
// import "./Headerr.css";
// import ProfileMenu from "./ProfileMenu";

// const Header = ({ onGetStartedClick }) => {
//     const { isLoggedIn } = useAuth();
//     return (
//         <div className="navbar">
//             <div className="navbar-left navbar-title">
//                 <Link to="/Home">
//                     <span>InterioLine</span>
//                 </Link>
//             </div>
//             {isLoggedIn ? (
//                 <div className="navbar-right">
//                     <button className="icon-button notification-container" title="Notifications">
//                         <FaBell className="navicon" />
//                         <span className="notification-dot"></span>
//                     </button>
//                     <ChatIconWithWidget />
//                     <ProfileMenu />
//                 </div>
//             ) : (
//                 <div className="navbar-right">
//                     <input
//                         type="text"
//                         placeholder="Search"
//                         className="search-input"
//                     />
//                     <button
//                         onClick={onGetStartedClick}
//                         className="get-started-button"
//                     >
//                         Get Started
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default Header;


import { Link } from "react-router-dom";
import { useAuth } from "../provider/authcontext";
import ChatIconWithWidget from "./chatIcon";
import "./Headerr.css";
import NotificationComponent from "./notification";
import ProfileMenu from "./ProfileMenu";

const Header = ({ onGetStartedClick }) => {
    const { isLoggedIn, loading,userId } = useAuth();

    // Show loading state while auth is being determined
    if (loading) {
        return (
            <div className="navbar">
                <div className="navbar-left navbar-title">
                    <Link to="/Home">
                        <span>InterioLine</span>
                    </Link>
                </div>
                <div className="navbar-right">
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
        <div className="navbar">
            <div className="navbar-left navbar-title">
                <Link to="/Home">
                    <span>InterioLine</span>
                </Link>
            </div>
            {isLoggedIn ? (
                <div className="navbar-right">
                    <NotificationComponent userId={userId} />

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