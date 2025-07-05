import axios from "axios";
import { useEffect, useState } from "react";
import { FiCreditCard, FiEdit, FiEye, FiStar, FiTrendingUp, FiUsers } from "react-icons/fi";
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
import PaymentPage from "./PaymentPage.jsx";

export default function MyProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showPaymentPage, setShowPaymentPage] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [paymentType, setPaymentType] = useState('initial');
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dashboardStats, setDashboardStats] = useState({
        activeProjects: 0,
        totalClients: 0,
        revenueThisMonth: 0,
        averageRating: 0
    });

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
                const projectsData = res.data || [];
                setProjects(projectsData);
                console.log("✅ Projects loaded:", projectsData?.length || 0);

                // Fetch payment details for each project
                const paymentDetails = {};
                for (const project of projectsData) {
                    const payments = await checkProjectPayments(project._id);
                    paymentDetails[project._id] = payments;
                }
                setProjectPaymentDetails(paymentDetails);

                // Calculate dashboard stats for designers
                if (userRole === 'designer' && projectsData) {
                    calculateDashboardStats(projectsData);
                }
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

        const fetchDesignerStats = async () => {
            if (userRole !== 'designer') return;

            try {
                const token = getToken();
                const config = {
                    ...(token && {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                };

                // Fetch designer statistics from the project controller
                const statsRes = await axios.get(`http://localhost:2005/api/project/designer/stats/${userId}`, config);
                if (statsRes.data) {
                    setDashboardStats(prev => ({
                        ...prev,
                        totalClients: statsRes.data.totalClients || 0,
                        revenueThisMonth: statsRes.data.revenueThisMonth || 0,
                        averageRating: statsRes.data.averageRating || 4.5,
                        totalReviews: statsRes.data.totalReviews || 0
                    }));
                    console.log("✅ Designer stats updated:", statsRes.data);
                }
            } catch (err) {
                console.error("❌ Error fetching designer stats:", err);
                // Don't show error for stats - it's not critical
            }
        };

        const loadData = async () => {
            setLoading(true);

            await fetchProjects();

            // Only fetch profile if user is a client
            if (userRole === 'client') {
                await fetchUserProfile();
            }

            // Fetch additional stats for designers
            if (userRole === 'designer') {
                await fetchDesignerStats();
            }

            setLoading(false);
        };

        loadData();
    }, [userId, userRole, isLoggedIn, authLoading, navigate, isUserIdAvailable, getToken]);

    const calculateDashboardStats = (projectsData) => {
        const activeProjects = projectsData.filter(p =>
            p.status === 'pending' || p.status === 'in_progress'
        ).length;

        // Get unique clients
        const uniqueClients = new Set(projectsData.map(p => p.client)).size;

        // Calculate this month's revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthRevenue = projectsData
            .filter(p => {
                const projectDate = new Date(p.createdAt);
                return projectDate.getMonth() === currentMonth &&
                    projectDate.getFullYear() === currentYear &&
                    p.status === 'completed';
            })
            .reduce((total, p) => total + (parseFloat(p.payment) || 0), 0);

        setDashboardStats(prev => ({
            ...prev,
            activeProjects,
            totalClients: uniqueClients,
            revenueThisMonth: thisMonthRevenue
        }));
    };

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
            const updatedProjects = projects.map(project =>
                project._id === projectId
                    ? { ...project, status: newStatus }
                    : project
            );
            setProjects(updatedProjects);

            // Recalculate dashboard stats
            if (userRole === 'designer') {
                calculateDashboardStats(updatedProjects);
            }

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

    // Payment Functions
    const handlePaymentClick = (project) => {
        setSelectedProject(project);

        // Determine payment type based on project payment status
        if (project.payment === 'pending') {
            setPaymentType('initial');
        } else if (project.payment === 'half-installment') {
            setPaymentType('final');
        }

        setShowPaymentPage(true);
    };

    const handlePaymentSuccess = (paymentData) => {
        console.log('💳 Payment successful:', paymentData);

        // Refresh payment details for the project
        const refreshPaymentDetails = async () => {
            const payments = await checkProjectPayments(selectedProject._id);
            setProjectPaymentDetails(prev => ({
                ...prev,
                [selectedProject._id]: payments
            }));
        };

        refreshPaymentDetails();

        setShowPaymentPage(false);
        setSelectedProject(null);

        // Show success toast
        showToast(
            `Payment of Rs. ${paymentData.amount.toLocaleString()} completed successfully!`,
            "success"
        );
    };

    const handleClosePayment = () => {
        setShowPaymentPage(false);
        setSelectedProject(null);
    };

    const calculatePaymentAmount = (project, type) => {
        const basePrice = 50000;
        let totalAmount = basePrice;

        if (project?.room_dimensions) {
            const area = (project.room_dimensions.length || 10) * (project.room_dimensions.width || 10);
            totalAmount += area * 500;
        }

        return type === 'initial' || type === 'final' ? Math.round(totalAmount * 0.5) : totalAmount;
    };

    // Check actual payment status by checking payment records
    const [projectPaymentDetails, setProjectPaymentDetails] = useState({});

    const checkProjectPayments = async (projectId) => {
        try {
            const response = await axios.get(`http://localhost:2005/api/payment/history?projectId=${projectId}`);
            if (response.data.success) {
                const payments = response.data.payments.filter(p => p.status === 'succeeded');
                return payments;
            }
            return [];
        } catch (error) {
            console.error('Error fetching payment history:', error);
            return [];
        }
    };

    // Check if project can accept payments
    const canMakePayment = (project) => {
        const payments = projectPaymentDetails[project._id] || [];

        // If there's a "full" payment, no more payments allowed
        const hasFullPayment = payments.some(p => p.payment_type === 'full');
        if (hasFullPayment) return false;

        // If there are 2 or more payments (initial + final), no more payments
        if (payments.length >= 2) return false;

        return userRole === 'client' && project.status !== 'cancelled';
    };

    // Check if should show payment history button
    const shouldShowPaymentHistory = (project) => {
        const payments = projectPaymentDetails[project._id] || [];

        // Show history if there's a full payment OR if there are any successful payments
        const hasFullPayment = payments.some(p => p.payment_type === 'full');
        const hasAnyPayments = payments.length > 0;

        return userRole === 'client' && (hasFullPayment || hasAnyPayments);
    };

    // Get payment status display
    const getPaymentStatusDisplay = (project) => {
        const payments = projectPaymentDetails[project._id] || [];

        // Check for full payment first
        const hasFullPayment = payments.some(p => p.payment_type === 'full');
        if (hasFullPayment) return '✅ Paid (Full)';

        // Check for multiple payments
        if (payments.length >= 2) return '✅ Paid (Installments)';

        // Check for single payment
        if (payments.length === 1) {
            const payment = payments[0];
            if (payment.payment_type === 'initial') return '🔄 50% Paid';
        }

        return '⏳ Payment Pending';
    };

    // Get payment button text
    const getPaymentButtonText = (project) => {
        const payments = projectPaymentDetails[project._id] || [];

        if (payments.length === 0) {
            return 'Pay Initial (50%)';
        } else if (payments.length === 1 && payments[0].payment_type === 'initial') {
            return 'Pay Final (50%)';
        }
        return 'Pay Now';
    };

    // Handle payment history view
    const handlePaymentHistory = (project) => {
        const payments = projectPaymentDetails[project._id] || [];

        let historyMessage = `Payment History for ${project.title}:\n\n`;

        if (payments.length === 0) {
            historyMessage += 'No payments found.';
        } else {
            payments.forEach((payment, index) => {
                const date = new Date(payment.payment_date).toLocaleDateString();
                const amount = payment.amount.toLocaleString();
                const type = payment.payment_type === 'full' ? 'Full Payment' :
                    payment.payment_type === 'initial' ? 'Initial Payment (50%)' : 'Final Payment (50%)';

                historyMessage += `${index + 1}. ${type}\n`;
                historyMessage += `   Amount: Rs. ${amount}\n`;
                historyMessage += `   Date: ${date}\n`;
                historyMessage += `   Status: ${payment.status}\n\n`;
            });

            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            historyMessage += `Total Paid: Rs. ${totalPaid.toLocaleString()}`;
        }

        alert(historyMessage);
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
                {/* Designer Welcome Section */}
                {userRole === 'designer' && (
                    <div className="designer-welcome">
                        <h2>Welcome back, kir!</h2>
                        <p>Here's what's happening with your design projects</p>
                    </div>
                )}

                {/* Designer Dashboard Stats */}
                {userRole === 'designer' && (
                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <div className="stat-icon blue">
                                <FiEye />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">{dashboardStats.activeProjects}</div>
                                <div className="stat-label">Active Projects</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon green">
                                <FiUsers />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">{dashboardStats.totalClients}</div>
                                <div className="stat-label">Total Clients</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon purple">
                                <FiTrendingUp />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">${dashboardStats.revenueThisMonth.toLocaleString()}</div>
                                <div className="stat-label">Revenue This Month</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon yellow">
                                <FiStar />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">{dashboardStats.averageRating.toFixed(1)}</div>
                                <div className="stat-label">Average Rating</div>
                            </div>
                        </div>
                    </div>
                )}

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
                                        <p>Amount: <strong>Rs. {project.payment_amount || 50000}</strong></p>
                                        <p>Payment: <strong>{getPaymentStatusDisplay(project)}</strong></p>
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

                                    {/* Payment Button - Only for clients on unpaid projects */}
                                    {canMakePayment(project) && (
                                        <button
                                            className="action-btn payment-btn"
                                            onClick={() => handlePaymentClick(project)}
                                            style={{
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                marginLeft: '8px'
                                            }}
                                        >
                                            <FiCreditCard style={{ marginRight: '4px' }} />
                                            {getPaymentButtonText(project)}
                                        </button>
                                    )}

                                    {/* Payment History Button - Show when payments exist */}
                                    {shouldShowPaymentHistory(project) && !canMakePayment(project) && (
                                        <button
                                            className="action-btn history-btn"
                                            onClick={() => handlePaymentHistory(project)}
                                            style={{
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                marginLeft: '8px'
                                            }}
                                        >
                                            <FiEye style={{ marginRight: '4px' }} />
                                            Payment History
                                        </button>
                                    )}
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

            {/* Payment Page */}
            {showPaymentPage && selectedProject && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000
                }}>
                    <PaymentPage
                        projectId={selectedProject._id}
                        amount={calculatePaymentAmount(selectedProject, paymentType)}
                        paymentType={paymentType}
                        onSuccess={handlePaymentSuccess}
                        onClose={handleClosePayment}
                        userId={userId}
                        project={selectedProject}
                    />
                </div>
            )}

        </div>
    );
}