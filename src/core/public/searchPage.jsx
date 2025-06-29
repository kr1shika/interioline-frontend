import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import matchImg from "../../assets/images/MATCH.png";
import qbohemian from "../../assets/images/quiz/qbohemian.png";
import qminimalist from "../../assets/images/quiz/qminimalist.png";
import qmodern from "../../assets/images/quiz/qmodern.png";
import qscandinavian from "../../assets/images/quiz/qscandinavian.png";
import qtraditional from "../../assets/images/quiz/qtraditional.png";
import Header from "../../components/header.jsx";
import "../style/searchPage.css";
import AuthPopup from "./authComponent.jsx";

export default function SearchDesignersPage() {
    const [designers, setDesigners] = useState([]);
    const [showAuth, setShowAuth] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDesigners = async () => {
            try {
                const res = await axios.get("http://localhost:2005/api/user/getAllDesigners");
                const designersData = res.data;

                // For each designer, fetch their portfolio posts
                const designersWithPrimaryImage = await Promise.all(
                    designersData.map(async (designer) => {
                        try {
                            const postRes = await axios.get(`http://localhost:2005/api/portfolio/posts/${designer._id}`);
                            const posts = postRes.data.posts;

                            // Find the first image from the first post
                            const firstPost = posts[0];
                            let primaryImage = null;

                            if (firstPost && firstPost.images && firstPost.images.length > 0) {
                                const primary = firstPost.images.find(img => img.is_primary);
                                primaryImage = primary ? primary.url : firstPost.images[0].url;
                            }

                            return { ...designer, primaryImage };
                        } catch (err) {
                            console.error(`Error fetching portfolio for ${designer.full_name}:`, err);
                            return { ...designer, primaryImage: null };
                        }
                    })
                );

                setDesigners(designersWithPrimaryImage);
            } catch (err) {
                console.error("Failed to fetch designers:", err);
            }
        };

        fetchDesigners();
    }, []);


    return (
        <div className="page-wrapper">
            <Header onGetStartedClick={() => setShowAuth(true)} />
            <main>
                {/* Match Section */}
                <section className="match-section">
                    <div className="match-text">
                        <h2>MATCH WITH A DESIGNER</h2>
                        <p>Share your vision. We'll help you find the designer who gets it.</p>
                        <button onClick={() => navigate("/quiz")} className="match-button">Match</button>
                    </div>
                    <img src={matchImg} alt="Match Illustration" className="match-illustration" />
                </section>
                <section className="style-section">
                    <h3>Browse by Style</h3>
                    <div className="style-grid">
                        {[
                            { name: "Bohemian", image: qbohemian },
                            { name: "Minimalist", image: qminimalist },
                            { name: "Modern", image: qmodern },
                            { name: "Scandinavian", image: qscandinavian },
                            { name: "Traditional", image: qtraditional },
                        ].map((style, i) => (
                            <div key={i} className="style-card">
                                <img src={style.image} alt={style.name} />
                                <p>{style.name}</p>
                            </div>
                        ))}
                    </div>
                </section>
                {/* Designers Section */}
                <section className="designers-section">
                    <h3>Meet Our Designers</h3>
                    <div className="designers-grid">
                        {designers.map((designer, i) => (
                            <div key={i} className="designer-card" onClick={() => navigate(`/designer/${designer._id}`)}
                            >
                                <div className="designer-header">
                                    <img
                                        src={
                                            designer.profilepic
                                                ? `http://localhost:2005${designer.profilepic}`
                                                : "/assets/default-avatar.png"
                                        }
                                        alt={designer.full_name}
                                        className="w-34 h-34 rounded-full object-cover"
                                    />
                                    <div>
                                        <h4>{designer.full_name}</h4>
                                        <p>{designer.bio || "Designer bio unavailable."}</p>
                                    </div>
                                </div>
                                <img
                                    src={
                                        designer.primaryImage
                                            ? `http://localhost:2005${designer.primaryImage}`
                                            : "/assets/rooms/sample1.jpg"
                                    }
                                    alt="room"
                                    className="room-preview"
                                />

                                {/* 
                                <p className="designer-description">
                                    Kathmandu-based designer specializing in eclectic interiors that blend textures and cultures.
                                </p> */}
                            </div>
                        ))}
                    </div>
                    <div className="load-more">
                        <button>MORE</button>
                    </div>
                </section>
            </main>

            {showAuth && <AuthPopup onClose={() => setShowAuth(false)} />}
        </div>
    );
}
