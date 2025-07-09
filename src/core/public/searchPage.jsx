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
import { useAuth } from "../../provider/authcontext.jsx";
import "../style/searchPage.css";
import AuthPopup from "./authComponent.jsx";

export default function SearchDesignersPage() {
    const [designers, setDesigners] = useState([]);
    const [showAuth, setShowAuth] = useState(false);
    const [isQuizBased, setIsQuizBased] = useState(false);
    const [userQuizData, setUserQuizData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isLoggedIn, userId, userRole } = useAuth();

    const calculateCompatibilityScore = (designer, quizAnswers) => {
        let score = 0;

        const quizStyle = quizAnswers["2"]?.toLowerCase(); // interior style
        const quizTone = quizAnswers["4"]?.toLowerCase();  // color tones
        const quizFunction = quizAnswers["5"]?.toLowerCase(); // functionality

        // Style match (specialization) - 40 points
        if (designer.specialization?.toLowerCase().includes(quizStyle)) {
            score += 40;
        }

        // Tone match - 30 points
        if (
            designer.preferredTones &&
            Array.isArray(designer.preferredTones) &&
            designer.preferredTones.some(tone => tone.toLowerCase() === quizTone)
        ) {
            score += 30;
        }

        // Functional/Decorative approach - 30 points
        if (designer.approach?.toLowerCase() === quizFunction) {
            score += 30;
        }

        return score;
    };

    // Simple function to generate style analysis
    const generateStyleAnalysis = (answers) => {
        const parts = [];

        if (answers["2"]) {
            parts.push(`You like the ${answers["2"]} style.`);
        }

        if (answers["3"] === "Calm and simple") {
            parts.push("You enjoy calm, clean spaces with a peaceful feel.");
        } else if (answers["3"] === "Bold and unique") {
            parts.push("You love bold choices and creative designs.");
        } else {
            parts.push("You enjoy both bold features and peaceful elements.");
        }

        if (answers["4"]) {
            parts.push(`You're drawn to ${answers["4"]} tones.`);
        }

        if (answers["5"]?.toLowerCase().includes("functional")) {
            parts.push("You prefer designs that are practical and useful.");
        } else if (answers["5"]?.toLowerCase().includes("decorative")) {
            parts.push("You prefer designs that focus on beauty and charm.");
        } else {
            parts.push("You like a mix of usefulness and beauty.");
        }

        return parts.join(" ");
    };

    useEffect(() => {
        const fetchDesigners = async () => {
            try {
                setLoading(true);

                // First, fetch all designers with their portfolio images
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

                // Check if user is logged in and has quiz data
                if (isLoggedIn && userId && userRole === "client") {
                    try {
                        // Fetch current user's data to check for quiz answers
                        const userRes = await axios.get(`http://localhost:2005/api/user/${userId}`);
                        const userData = userRes.data;

                        // Check if user has completed the style quiz
                        if (userData.style_quiz && Object.keys(userData.style_quiz).length > 0) {
                            console.log("✅ User has quiz data, splitting designers by compatibility");

                            // Calculate compatibility scores for each designer
                            const designersWithScores = designersWithPrimaryImage.map(designer => ({
                                ...designer,
                                compatibilityScore: calculateCompatibilityScore(designer, userData.style_quiz)
                            }));

                            // Sort by compatibility score (highest first)
                            const sortedDesigners = designersWithScores.sort((a, b) =>
                                b.compatibilityScore - a.compatibilityScore
                            );

                            setDesigners(sortedDesigners);
                            setUserQuizData(userData.style_quiz);
                            setIsQuizBased(true);
                        } else {
                            // No quiz data, show designers in default order
                            setDesigners(designersWithPrimaryImage);
                            setIsQuizBased(false);
                        }
                    } catch (error) {
                        console.error("Error fetching user quiz data:", error);
                        // Fallback to default order
                        setDesigners(designersWithPrimaryImage);
                        setIsQuizBased(false);
                    }
                } else {
                    // User not logged in or not a client, show default order
                    setDesigners(designersWithPrimaryImage);
                    setIsQuizBased(false);
                }

            } catch (err) {
                console.error("Failed to fetch designers:", err);
                setDesigners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDesigners();
    }, [isLoggedIn, userId, userRole]);

    // Simple function to get compatibility percentage
    const getCompatibilityPercentage = (score) => {
        return Math.round((score / 100) * 100);
    };

    // Simple function to get badge class
    const getCompatibilityBadgeClass = (score) => {
        if (score >= 80) return "compatibility-badge high";
        if (score >= 50) return "compatibility-badge medium";
        if (score >= 20) return "compatibility-badge low";
        return "compatibility-badge minimal";
    };

    // Split designers into recommended (59%+) and others
    const recommendedDesigners = isQuizBased
        ? designers.filter(designer => getCompatibilityPercentage(designer.compatibilityScore) >= 59)
        : [];

    const otherDesigners = isQuizBased
        ? designers.filter(designer => getCompatibilityPercentage(designer.compatibilityScore) < 59)
        : designers;

    return (
        <div className="page-wrapper">
            <Header onGetStartedClick={() => setShowAuth(true)} />
            <main>
                {/* Match Section */}
                <section className="match-section">
                    <div className="match-text">
                        <h2>MATCH WITH A DESIGNER</h2>
                        <p>Share your vision. We'll help you find the designer who gets it.</p>
                        <button onClick={() => navigate("/quiz")} className="match-button">
                            {isQuizBased ? "Retake Quiz" : "Match"}
                        </button>
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

                {/* Recommended Designers Section - Only show if user has quiz data and there are good matches */}
                {isQuizBased && recommendedDesigners.length > 0 && (
                    <section className="recommended-designers-section">
                        <h3>
                            Recommended for You ({recommendedDesigners.length} matches)
                            {loading && <span className="loading-indicator"> (Loading...)</span>}
                        </h3>
                        <p className="recommendation-subtitle">
                            These designers are a {recommendedDesigners.length > 1 ? 'great match' : 'perfect match'} for your style preferences (59%+ compatibility)
                        </p>

                        <div className="designers-grid recommended-grid">
                            {recommendedDesigners.map((designer, i) => (
                                <div
                                    key={designer._id || i}
                                    className="designer-card quiz-ranked recommended"
                                    onClick={() => navigate(`/designer/${designer._id}`)}
                                >
                                    {/* Compatibility Badge */}
                                    <div className={getCompatibilityBadgeClass(designer.compatibilityScore)}>
                                        {getCompatibilityPercentage(designer.compatibilityScore)}% Match
                                    </div>

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
                                            {designer.specialization && (
                                                <p className="specialization">
                                                    Specializes in {designer.specialization}
                                                </p>
                                            )}
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

                                    <div className="compatibility-details">
                                        <p className="compatibility-text">
                                            Perfect match for your {userQuizData["2"]?.toLowerCase()} style preferences
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* All Designers Section */}
                <section className="designers-section">
                    <h3>
                        {isQuizBased ?
                            `All Designers${otherDesigners.length > 0 ? ` (${otherDesigners.length} more)` : ''}` :
                            "Meet Our Designers"
                        }
                        {loading && <span className="loading-indicator"> (Loading...)</span>}
                    </h3>

                    {loading ? (
                        <div className="loading-placeholder">
                            <p>Finding the perfect designers for you...</p>
                        </div>
                    ) : (
                        <>
                            <div className="designers-grid">
                                {designers.map((designer, i) => (
                                    <div
                                        key={designer._id || i}
                                        className={`designer-card ${isQuizBased ? 'quiz-ranked' : ''}`}
                                        onClick={() => navigate(`/designer/${designer._id}`)}
                                    >
                                        {/* Compatibility Badge */}
                                        {isQuizBased && (
                                            <div className={getCompatibilityBadgeClass(designer.compatibilityScore)}>
                                                {getCompatibilityPercentage(designer.compatibilityScore)}% Match
                                            </div>
                                        )}



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
                                                {/* Show specialization if it matches quiz */}
                                                {isQuizBased && designer.specialization && (
                                                    <p className="specialization">
                                                        Specializes in {designer.specialization}
                                                    </p>
                                                )}
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

                                        {/* Compatibility details for quiz-based results */}
                                        {isQuizBased && (
                                            <div className="compatibility-details">
                                                <p className="compatibility-text">
                                                    Great match for your {userQuizData["2"]?.toLowerCase()} style preferences
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="load-more">
                                <button>MORE</button>
                            </div>
                        </>
                    )}
                </section>
            </main>

            {showAuth && <AuthPopup onClose={() => setShowAuth(false)} />}
        </div>
    );
}