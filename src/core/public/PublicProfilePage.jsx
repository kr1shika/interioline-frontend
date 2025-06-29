import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/header.jsx";
import PortfolioPostViewer from "../../components/PortfolioPostViewer.jsx";
import "./../style/publicprofile.css";

export default function PublicProfilePage() {
    const { designerId } = useParams();
    const [designer, setDesigner] = useState(null);
    const [portfolioPosts, setPortfolioPosts] = useState([]);
    const [activePost, setActivePost] = useState(null);

    useEffect(() => {
        const fetchDesigner = async () => {
            try {
                const res = await axios.get(`http://localhost:2005/api/user/${designerId}`);
                setDesigner(res.data);
            } catch (err) {
                console.error("Error fetching designer profile", err);
            }
        };

        const fetchPortfolioPosts = async () => {
            try {
                const res = await axios.get(`http://localhost:2005/api/portfolio/posts/${designerId}`);
                setPortfolioPosts(res.data.posts);
            } catch (err) {
                console.error("Error fetching portfolio posts", err);
            }
        };

        if (designerId) {
            fetchDesigner();
            fetchPortfolioPosts();
        }
    }, [designerId]);

    if (!designer) {
        return (
            <div className="public-profile-page">
                <Header />
                <div className="loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="public-profile-page">
            <Header />

            <div className="profile-container">
                {/* Profile Card */}
                <div className="profile-card">
                    <div className="profile-pic-wrapper">
                        <img
                            src={
                                designer.profilepic
                                    ? `http://localhost:2005${designer.profilepic}`
                                    : "/assets/default-avatar.png"
                            }
                            alt={designer.full_name}
                            className="profile-pic"
                        />
                    </div>

                    <div className="profile-info">
                        <h2>{designer.full_name}</h2>
                        <p className="location">Kathmandu, Nepal</p>
                        <p className="bio">{designer.bio}</p>
                    </div>
                </div>

                {/* Portfolio Section */}
                <section className="portfolio-section">
                    <h3>Portfolio</h3>
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
                                        className="portfolio-card"
                                        onClick={() => setActivePost(post)}
                                    >
                                        <img
                                            src={`http://localhost:2005${primaryImage.url}`}
                                            alt={primaryImage.caption || post.title}
                                        />
                                        <div className="portfolio-overlay">
                                            {post.title}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Reviews Section */}
                <section className="review-section">
                    <h3>Reviews</h3>
                    <div className="review-grid">
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