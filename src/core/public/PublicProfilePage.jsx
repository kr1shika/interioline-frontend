import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/header.jsx";
import PortfolioPostViewer from "../../components/PortfolioPostViewer.jsx";
import "./../style/profile.css"; // Changed to use the same CSS as private profile

export default function PublicProfilePage() {
    const { designerId } = useParams();
    const [designer, setDesigner] = useState(null);
    const [portfolioPosts, setPortfolioPosts] = useState([]);
    const [activePost, setActivePost] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        const fetchDesigner = async () => {
            try {
                const res = await axios.get(`http://localhost:2005/api/user/${designerId}`);
                setDesigner(res.data);
            } catch (err) {
                console.error("Error fetching designer profile", err);
            } finally {
                setLoadingProfile(false);
            }
        };

        const fetchPortfolioPosts = async () => {
            try {
                const res = await axios.get(`http://localhost:2005/api/portfolio/posts/${designerId}`);
                setPortfolioPosts(res.data.posts || []);
            } catch (err) {
                console.error("Error fetching portfolio posts", err);
            }
        };

        if (designerId) {
            fetchDesigner();
            fetchPortfolioPosts();
        }
    }, [designerId]);

    // Show loading while profile data is being fetched
    if (loadingProfile || !designer) {
        return (
            <div className="profile-page">
                <Header />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '400px',
                    fontSize: '16px',
                    color: '#C2805A'
                }}>
                    Loading profile...
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Header />

            <div className="profile-container">
                {/* Profile Card - Same structure as private but without edit button */}
                <div className="profile-card">
                    <div className="profile-card-content">
                        <img
                            src={
                                designer.profilepic
                                    ? `http://localhost:2005${designer.profilepic}`
                                    : "/assets/default-avatar.png"
                            }
                            alt={designer.full_name}
                            className="profile-image"
                        />

                        <div className="profile-content">
                            <div className="profile-info">
                                <h1>{designer.full_name}</h1>
                                <p className="location">Kathmandu, Nepal</p>
                                <p className="bio">{designer.bio}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Portfolio Section - Same structure as private but without add button */}
                <section className="portfolio-section">
                    <div className="section-header">
                        <h2>Portfolio</h2>
                    </div>

                    <div className="portfolio-grid">
                        {portfolioPosts.length === 0 ? (
                            <div className="no-posts">
                                No portfolio posts available.
                            </div>
                        ) : (
                            portfolioPosts.map((post) => {
                                const primaryImage = post.images.find(img => img.is_primary) || post.images[0];
                                if (!primaryImage) return null;

                                return (
                                    <div
                                        key={post._id}
                                        className="portfolio-post"
                                        onClick={() => setActivePost(post)}
                                    >
                                        <img
                                            src={`http://localhost:2005${primaryImage.url}`}
                                            alt={primaryImage.caption || post.title}
                                        />
                                        <div className="post-overlay">
                                            <span className="post-title">{post.title}</span>
                                            {/* Removed trash icon for public view */}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Reviews Section - Same structure as private */}
                <section className="reviews-section">
                    <div className="section-header">
                        <h2>Reviews</h2>
                    </div>
                    <div className="reviews-grid">
                        {[
                            { name: "Tara Lively", text: "Loved how good the designer was at understanding my visions..." },
                            { name: "Yuki", text: "Loved the design work and the process." },
                            { name: "Sel", text: "Great communication and visuals!" }
                        ].map((review, index) => (
                            <div key={index} className="review-card">
                                <strong>{review.name}</strong>
                                <p>{review.text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Portfolio Post Viewer Modal */}
            {activePost && (
                <PortfolioPostViewer
                    post={activePost}
                    onClose={() => setActivePost(null)}
                />
            )}
        </div>
    );
}