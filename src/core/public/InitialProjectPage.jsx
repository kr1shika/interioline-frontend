
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import match from "../../assets/images/contact.png";
import img2 from "../../assets/images/meow.png";

import img3 from "../../assets/images/meow101.png";
import Header from "../../components/header.jsx";
import "../style/initiatizeProject.css";
export default function InitialProjectPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId, designerId } = location.state || {};

    const [title, setTitle] = useState("");
    const [placeholder, setPlaceholder] = useState("Loading...");
    const [designer, setDesigner] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await axios.get(`http://localhost:2005/api/user/${userId}`);
                const designerRes = await axios.get(`http://localhost:2005/api/user/${designerId}`);

                const quizAnswer1 = userRes.data?.style_quiz?.["1"];
                setPlaceholder(quizAnswer1 || "Untitled Project");
                setDesigner(designerRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchData();
    }, [userId, designerId]);

    const handleConfirm = async () => {
        try {
            const res = await axios.post("http://localhost:2005/api/project/createProject", {
                title: title || placeholder,
                client: userId,
                designer: designerId,
                payment: "pending",
            });

            if (res.status === 201) {
                alert("Project initialized!");
                navigate("/initial-project");
            }
        } catch (err) {
            console.error("Failed to create project:", err);
            alert("Failed to initialize project.");
        }
    };

    return (
        <div className="initial-project-page">
            <Header onGetStartedClick={() => setShowAuth(true)} />

            <h2>Initialize your project</h2>

            <input
                type="text"
                className="project-title-input"
                placeholder={placeholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            {designer && (
                <div className="designer-avatar-wrapper">
                    <img
                        className="designer-avatar"
                        src={designer.profilepic || "/default-avatar.png"}
                        alt="designer avatar"
                    />
                    <p className="selection-line">
                        You’ve selected <strong>{designer.full_name}</strong> as your designer.
                    </p>
                </div>
            )}

            <div className="payment-cards">
                <div className="card">
                    <img style={{ height: "115px", width: "220px" }} src={img3} alt="" />                    <h4>Kick-off and Discovery</h4>
                    <p>Share ideas and scope</p>
                    <span className="price">$0</span>
                </div>

                <div className="card">
                    <img style={{ height: "118px" }} src={match} alt="" />                                        <h4>Design work deposit</h4>
                    <p>Share ideas and scope</p>
                    <span className="price">from $90</span>
                </div>

                <div className="card">
                    <img style={{ height: "115px" }} src={img2} alt="" />                                        <h4>Final delivery</h4>
                    <p>Share ideas and scope</p>
                    <span className="price">from $200</span>
                </div>
            </div>

            <button className="confirm-btn" onClick={handleConfirm}>Confirm</button>
        </div>
    );

}
