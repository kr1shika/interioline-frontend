import axios from "axios";
import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import bannerArt from "../../assets/images/art.png";
import profile from "../../assets/images/profile.jpg";
import room from "../../assets/images/room.png";
import Header from "../../components/header.jsx";
import Toast from "../../components/toastMessage.jsx";
import { useAuth } from "../../provider/authcontext";
import EditProfileForm from "../private/designer/EditProfileForm.jsx";
import "../style/myprj.css";
import { getRoomConfigurationByProjectId } from "./editingRoom/components/room-designer/furniture-Catalog";

export default function MyProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const {
        userId,
        userRole,
        isLoggedIn,
        isUserIdAvailable,
        getToken,
        loading: authLoading
    } = useAuth();

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // 🔐 Security checks
        if (!isLoggedIn || !isUserIdAvailable()) {
            console.log("🔒 Not authenticated, redirecting to home");
            navigate('/');
            return;
        }

        const fetchProjects = async () => {
            try {
                const token = getToken();
                const config = {
                    ...(token && {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                };

                const res = await axios.get(`http://localhost:2005/api/project/user/${userId}`, config);
                setProjects(res.data || []);
                console.log("✅ Projects loaded:", res.data?.length || 0);
            } catch (err) {
                console.error("❌ Error fetching projects:", err);

                if (err.response?.status === 401) {
                    setError("Session expired. Please log in again.");
                } else {
                    setError("Failed to load projects. Please try again.");
                }
            }
        };

        const fetchUserProfile = async () => {
            try {
                const token = getToken();
                const config = {
                    ...(token && {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                };

                const res = await axios.get(`http://localhost:2005/api/user/${userId}`, config);
                setUserProfile(res.data);
                console.log("✅ User profile loaded:", res.data.full_name);
            } catch (err) {
                console.error("❌ Error fetching user profile:", err);

                if (err.response?.status === 401) {
                    console.log("🔒 Unauthorized access to profile");
                }
            }
        };

        const loadData = async () => {
            setLoading(true);

            await fetchProjects();

            // Only fetch profile if user is a client
            if (userRole === 'client') {
                await fetchUserProfile();
            }

            setLoading(false);
        };

        loadData();
    }, [userId, userRole, isLoggedIn, authLoading, navigate, isUserIdAvailable, getToken]);

    const statusOptions = ["pending", "in_progress", "completed", "cancelled"];

    const updateProjectStatus = async (projectId, newStatus) => {
        if (!isUserIdAvailable()) {
            setError("Authentication required to update project status.");
            return;
        }

        try {
            const token = getToken();
            const config = {
                ...(token && {
                    headers: { Authorization: `Bearer ${token}` }
                })
            };

            await axios.patch(`http://localhost:2005/api/project/${projectId}/status`,
                { status: newStatus },
                config
            );

            // Update local state
            setProjects(projects.map(project =>
                project._id === projectId
                    ? { ...project, status: newStatus }
                    : project
            ));

            console.log("✅ Project status updated:", newStatus);
        } catch (err) {
            console.error("❌ Error updating project status:", err);

            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
            } else {
                setError("Failed to update project status.");
            }
        }
    };

    const getStatusProgress = (status) => {
        const statusMap = {
            'pending': 20,
            'in_progress': 50,
            'completed': 100,
            'cancelled': 0
        };
        return statusMap[status] || 0;
    };

    const statusLabelMap = {
        "pending": "Pending",
        "in_progress": "In Progress",
        "completed": "Completed",
        "cancelled": "Cancelled"
    };

    const handleEditProfile = () => {
        setShowEditProfile(true);
    };

    const handleCloseEditProfile = () => {
        setShowEditProfile(false);
        // Refresh user profile to reflect changes
        if (userRole === 'client') {
            fetchUserProfile();
        }
    };

    // Function to fetch updated user profile
    const fetchUserProfile = async () => {
        if (!isUserIdAvailable()) return;

        try {
            const token = getToken();
            const config = {
                ...(token && {
                    headers: { Authorization: `Bearer ${token}` }
                })
            };

            const res = await axios.get(`http://localhost:2005/api/user/${userId}`, config);
            setUserProfile(res.data);
        } catch (err) {
            console.error("❌ Error fetching user profile:", err);
        }
    };

    // Show toast message
    const showToast = (message, type = "info") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    // Modified function to handle edit/view button click
    const handleProjectAction = async (project) => {
        console.log("Project action clicked for:", project.title, "Status:", project.status);

        if (userRole === 'designer') {
            // Navigate to room editor with project data including status
            navigate('/room-edit', {
                state: {
                    projectId: project._id,
                    projectTitle: project.title,
                    projectStatus: project.status,
                    projectData: project
                }
            });
        } else {
            // For clients, check if room design exists first
            try {
                console.log("Checking for room configuration for project:", project._id);

                // Use the same function that CustomRoomDesigner uses
                const projectRoom = getRoomConfigurationByProjectId(project._id);

                console.log("Found project room:", projectRoom);

                if (projectRoom) {
                    console.log("Room found, navigating to view-only mode with status:", project.status);
                    // Navigate to view-only room designer with all project data including status
                    navigate('/room-view', {
                        state: {
                            projectId: project._id,
                            projectTitle: project.title,
                            projectStatus: project.status, // Make sure status is passed
                            projectData: project
                        }
                    });
                } else {
                    console.log("No room found for project");
                    // Show toast if no room design is available
                    showToast("Room design is not available yet. Please wait for the designer to create it.", "warning");
                }
            } catch (error) {
                console.error("Error checking for room design:", error);
                showToast("Unable to check room availability. Please try again.", "error");
            }
        }
    };

    // Show loading while auth is being determined
    if (authLoading) {
        return (
            <div className="my-projects-page">
                <Header />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '400px',
                    fontSize: '16px',
                    color: '#C2805A'
                }}>
                    🔐 Verifying authentication...
                </div>
            </div>
        );
    }

    // Show error if access denied
    if (error) {
        return (
            <div className="my-projects-page">
                <Header />
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    fontSize: '16px'
                }}>
                    <h2 style={{ color: '#dc3545' }}>Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: '#C2805A',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '16px'
                        }}
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="my-projects-page">
            <Header onGetStartedClick={() => setShowAuth(true)} />

            {/* Toast Message */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                />
            )}

            <div className="page-content">


                {/* Profile Section - Only for clients */}
                {userRole === 'client' && userProfile && (
                    <div className="profile-section">
                        <div className="profile-content">
                            <div className="profile-avatar">
                                <img
                                    src={userProfile.profilepic ? `http://localhost:2005${userProfile.profilepic}` : profile}
                                    alt="Profile"
                                    className="profile-image"
                                />
                            </div>
                            <div className="profile-info">
                                <h3 className="profile-name">{userProfile.full_name || 'Unknown User'}</h3>
                                <p className="profile-email">{userProfile.email || 'No email provided'}</p>
                            </div>
                            <div className="profile-actions">
                                <FiEdit
                                    onClick={handleEditProfile}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Show banner only for clients */}
                {userRole === 'client' && (
                    <div className="start-banner">
                        <div className="banner-text">
                            <h3>Your dream interior is just a step away!</h3>
                            <p>Don't wait any longer to create the perfect space that reflects your style and personality.</p>
                            <button className="start-btn">Start New Project</button>
                        </div>
                        <img src={bannerArt} alt="banner art" />
                    </div>
                )}

                <h3 className="section-heading">
                    {userRole === 'designer' ? 'Your Projects' : 'Ongoing Projects'}
                </h3>

                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#C2805A'
                    }}>
                        Loading projects...
                    </div>
                ) : (
                    <div className="project-list">
                        {projects.map((project) => (
                            <div className="project-card" key={project._id}>
                                <div className="project-card-content">
                                    <img src={room} alt="project icon" />
                                    <div className="project-info">
                                        <h4>{project.title}</h4>
                                        <div className="status-section">
                                            <div className="status-row">
                                                <span>Status: </span>
                                                {userRole === 'designer' ? (
                                                    <select
                                                        value={project.status}
                                                        onChange={(e) => updateProjectStatus(project._id, e.target.value)}
                                                        className="status-dropdown"
                                                    >
                                                        {statusOptions.map(status => (
                                                            <option key={status} value={status}>
                                                                {statusLabelMap[status]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <strong>{statusLabelMap[project.status]}</strong>
                                                )}
                                            </div>
                                            <div className="progress-container">
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${getStatusProgress(project.status)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="progress-text">
                                                    {getStatusProgress(project.status)}%
                                                </span>
                                            </div>
                                        </div>
                                        <p>Payment: <strong>{project.payment}</strong></p>
                                        <p className="created-at">Created {new Date(project.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="project-actions">
                                    <button
                                        className="action-btn"
                                        onClick={() => handleProjectAction(project)}
                                    >
                                        {userRole === 'designer' ? 'Edit' : 'View'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && projects.length === 0 && (
                    <div className="no-projects">
                        <p>No projects found. {userRole === 'client' ? 'Start your first project!' : 'You haven\'t been assigned any projects yet.'}</p>
                    </div>
                )}
            </div>

            {/* Edit Profile Popup */}
            {showEditProfile && userProfile && (
                <div className="edit-profile-overlay">
                    <EditProfileForm
                        designer={userProfile}
                        onClose={handleCloseEditProfile}
                    />
                </div>
            )}
        </div>
    );
}