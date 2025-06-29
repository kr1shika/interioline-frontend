import axios from "axios";
import { useEffect, useState } from "react";
import AddPortfolioModal from "../../../components/addPost.jsx";
import Header from "../../../components/header.jsx";
import PortfolioPostViewer from "../../../components/PortfolioPostViewer.jsx";
import "../../style/profile.css";
import EditProfileForm from "./EditProfileForm.jsx";

export default function ProfilePage() {
    const [designer, setDesigner] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [portfolioPosts, setPortfolioPosts] = useState([]);
    const [activePost, setActivePost] = useState(null);

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        const fetchDesigner = async () => {
            try {
                const res = await axios.get(`http://localhost:2005/api/user/${userId}`);
                setDesigner(res.data);
            } catch (err) {
                console.error("Error fetching designer profile", err);
            }
        };

        const fetchPortfolioPosts = async () => {
            try {
                const res = await axios.get(`http://localhost:2005/api/portfolio/posts/${userId}`);
                setPortfolioPosts(res.data.posts);
            } catch (err) {
                console.error("Error fetching portfolio posts", err);
            }
        };

        if (userId) {
            fetchDesigner();
            fetchPortfolioPosts();
        }
    }, [userId, showAddForm]);

    if (!designer) return <div>Loading...</div>;

    return (
        <div className="profile-page">
            <Header onGetStartedClick={() => setIsEditing(true)} />

            <div className={`profile-container ${isEditing ? "blur-disabled" : ""}`}>
                {/* Profile Card */}
                <div className="profile-card">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="edit-button"
                    >
                        Edit
                    </button>

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

                {/* Portfolio Section */}
                <section className="portfolio-section">
                    <div className="section-header">
                        <h2>Portfolio</h2>
                        <button onClick={() => setShowAddForm(true)} className="add-post-button">
                            + Add Post
                        </button>
                    </div>

                    <div className="portfolio-grid">
                        {portfolioPosts.length === 0 ? (
                            <div className="no-posts">
                                No portfolio posts yet. Add your first project!
                            </div>
                        ) : (
                            portfolioPosts.map((post) => {
                                const primaryImage =
                                    post.images.find((img) => img.is_primary) || post.images[0];
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
                                        <div className="post-overlay">{post.title}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Reviews Section */}
                <section className="reviews-section">
                    <div className="section-header">
                        <h2>Reviews</h2>
                    </div>
                    <div className="reviews-grid">
                        {[
                            { name: "Tara Lively", text: "Loved how good the designer was at understanding my visions..." },
                            { name: "Yuki", text: "Loved the design work and the process." },
                            { name: "Sel", text: "Great communication and visuals!" }
                        ].map((r, i) => (
                            <div key={i} className="review-card">
                                <strong>{r.name}</strong>
                                <p>{r.text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="modal-overlay">
                    <EditProfileForm designer={designer} onClose={() => setIsEditing(false)} />
                </div>
            )}

            {/* Add Portfolio Modal */}
            {showAddForm && (
                <AddPortfolioModal onClose={() => setShowAddForm(false)} />
            )}

            {/* Portfolio Post Viewer Modal */}
            {activePost && (
                <PortfolioPostViewer post={activePost} onClose={() => setActivePost(null)} />
            )}
        </div>
    );
}