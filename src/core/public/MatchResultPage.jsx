import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import match1 from "../../assets/images/MATCH.png";
import Header from "../../components/header.jsx";
import "../style/Matchresult.css";

export default function MatchResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showAuth, setShowAuth] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const { userName, match, styleAnalysis } = location.state || {};

    useEffect(() => {
        if (!match) {
            navigate("/style-quiz");
            return;
        }
        const fetchSuggestions = async () => {
            try {
                const res = await fetch("http://localhost:2005/api/user/getAllDesigners");
                const data = await res.json();

                // Filter out matched designer
                const filtered = data.filter(d => d._id !== match._id);

                // Fetch portfolio images for each suggestion
                const enhanced = await Promise.all(
                    filtered.map(async (designer) => {
                        try {
                            const postRes = await fetch(`http://localhost:2005/api/portfolio/posts/${designer._id}`);
                            const postData = await postRes.json();
                            const post = postData.posts[0];
                            const image =
                                post?.images.find(img => img.is_primary)?.url ||
                                post?.images[0]?.url ||
                                null;
                            return { ...designer, primaryImage: image };
                        } catch {
                            return { ...designer, primaryImage: null };
                        }
                    })
                );

                setSuggestions(enhanced);
            } catch (err) {
                console.error("Failed to load designers:", err);
            }
        };

        const fetchMatchPost = async () => {
            try {
                const res = await fetch(`http://localhost:2005/api/portfolio/posts/${match._id}`);
                const data = await res.json();
                const post = data.posts[0];
                const image =
                    post?.images.find(img => img.is_primary)?.url ||
                    post?.images[0]?.url ||
                    null;

                match.primaryImage = image; // 🟡 Mutating match (OK for state passed via `location.state`)
            } catch (err) {
                console.error("Failed to fetch matched designer image", err);
            }
        };

        fetchMatchPost();
        fetchSuggestions();
    }, [match, navigate]);


    return (
        <div className="match-page">
            <Header onGetStartedClick={() => setShowAuth(true)} />

            {/* Hero Section */}
            <section className="match-hero">
                <div className="hero-left">
                    <img
                        src={match1}
                        alt="match logo"
                        className="match-logo"
                        style={{ width: "230px", objectFit: "contain" }}
                    />
                    <h2>{userName}, Meet {match?.full_name}!</h2>
                    <p>Based on your preferences, we've found a designer who fits your style and needs best.</p>
                    <p className="style-analysis">{styleAnalysis}</p>
                </div>

                <div className="hero-right">
                    <img
                        src={
                            match?.primaryImage
                                ? `http://localhost:2005${match.primaryImage}`
                                : "/assets/rooms/sample1.jpg"
                        }
                        alt="room"
                    />

                    <div className="designer-info">
                        <div className="designer-meta">
                            <img
                                src={
                                    match?.profilepic
                                        ? `http://localhost:2005${match.profilepic}`
                                        : "/assets/default-avatar.png"
                                }
                                alt="profile"
                            />
                            <div>
                                <h3>{match.full_name}</h3>
                                <p className="specialization">{match.specialization}</p>
                                {/* No match percentage shown here */}
                            </div>
                        </div>
                        <button
                            className="select-btn"
                            onClick={() =>
                                navigate("/initial-project", {
                                    state: {
                                        userId: localStorage.getItem("userId"),  // ✅ use logged-in user ID
                                        designerId: match?._id,
                                    },
                                })
                            }
                        >
                            Select {match.full_name}
                        </button>
                    </div>
                </div>
            </section>

            {/* More Suggestions Section */}
            <section className="suggestions">
                <h4>More Suggestions</h4>
                <div className="suggestion-list">
                    {suggestions.map((designer, index) => (
                        <div key={index} className="suggestion-card">
                            <img src="/sample2.jpg" alt="room" />
                            <div className="suggestion-info">
                                <div className="suggestion-meta">
                                    <img src={designer.profilepic || "/default-avatar.png"} />
                                    <div>
                                        <h5>{designer.full_name}</h5>
                                        <p className="specialization">{designer.specialization}</p>
                                        {/* No percentage shown */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
