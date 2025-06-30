import axios from "axios";
import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { useNavigate } from "react-router-dom"; // Add this import
import bannerArt from "../../assets/images/art.png";
import profile from "../../assets/images/profile.jpg";
import room from "../../assets/images/room.png";
import Header from "../../components/header.jsx";
import EditProfileForm from "../private/designer/EditProfileForm.jsx";
import "../style/myprj.css";

export default function MyProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const navigate = useNavigate(); // Add this hook
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await axios.get(`http://localhost:2005/api/project/user/${userId}`);
                setProjects(res.data);
            } catch (err) {
                console.error("Error fetching projects:", err);
            }
        };

        const fetchUserProfile = async () => {
            try {
                const res = await axios.get(`http://localhost:2005/api/user/${userId}`);
                setUserProfile(res.data);
            } catch (err) {
                console.error("Error fetching user profile:", err);
            }
        };

        fetchProjects();

        // Only fetch profile if user is a client
        if (userRole === 'client') {
            fetchUserProfile();
        }
    }, [userId, userRole]);
    const statusOptions = ["pending", "in_progress", "completed", "cancelled"];

    const updateProjectStatus = async (projectId, newStatus) => {
        try {
            await axios.patch(`http://localhost:2005/api/project/${projectId}/status`, {
                status: newStatus
            });

            // Update local state
            setProjects(projects.map(project =>
                project._id === projectId
                    ? { ...project, status: newStatus }
                    : project
            ));
        } catch (err) {
            console.error("Error updating project status:", err);
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
        try {
            const res = await axios.get(`http://localhost:2005/api/user/${userId}`);
            setUserProfile(res.data);
        } catch (err) {
            console.error("Error fetching user profile:", err);
        }
    };

    // Add this function to handle edit/view button click
    const handleProjectAction = (project) => {
        if (userRole === 'designer') {
            // Navigate to room editor with project data
            navigate('/room-edit', {
                state: {
                    projectId: project._id,
                    projectTitle: project.title,
                    projectData: project
                }
            });
        } else {
            // For clients, just view the project (you can implement view logic here)
            console.log("Viewing project:", project);
            // You can navigate to a view-only version or show project details
        }
    };



    return (
        <div className="my-projects-page">
            <Header onGetStartedClick={() => setShowAuth(true)} />

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

                {projects.length === 0 && (
                    <div className="no-projects">
                        <p>No projects found. {userRole === 'client' ? 'Start your first project!' : 'You haven\'t been assigned any projects yet.'}</p>
                    </div>
                )}
            </div>

            {/* Edit Profile Popup */}
            {showEditProfile && (
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