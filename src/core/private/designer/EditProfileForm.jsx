import axios from "axios";
import { useEffect, useState } from "react";
import "../../style/EditProfileForm.css";
import PreferenceQuiz from "./PreferenceQuiz";

export default function EditProfileForm({ designer, onClose }) {
  const [full_name, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [file, setFile] = useState(null);
  const [preferredTones, setPreferredTones] = useState([]);
  const [approach, setApproach] = useState("Balanced");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole');
  const isClient = userRole === 'client';
  const isDesigner = userRole === 'designer';

  useEffect(() => {
    if (designer) {
      setFullName(designer.full_name || "");
      setBio(designer.bio || "");
      setEmail(designer.email || "");
      setSpecialization(designer.specialization || "");
      setExperience(designer.experience || "");
      setPreferredTones(designer.preferredTones || []);
      setApproach(designer.approach || "Balanced");

      // Check if quiz data exists to determine if quiz is completed (only for designers)
      if (isDesigner) {
        const hasQuizData = designer.preferredTones?.length > 0 ||
          designer.approach !== "Balanced" ||
          designer.specialization;
        setQuizCompleted(hasQuizData);
      }
    }
  }, [designer, isDesigner]);

  const handleQuizComplete = (quizData) => {
    // Immediately update all state variables
    setPreferredTones(quizData.preferredTones);
    setApproach(quizData.approach);
    setSpecialization(quizData.specialization);
    setQuizCompleted(true);
    setShowQuiz(false);

    // Force a re-render to show updated data immediately
    setTimeout(() => {
      // This ensures the UI updates are reflected
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("full_name", full_name);

    if (isClient) {
      data.append("email", email);
    } else {
      data.append("bio", bio);
      data.append("specialization", specialization);
      data.append("experience", experience);
      data.append("approach", approach);
      preferredTones.forEach((tone) => data.append("preferredTones", tone));
    }

    if (file) data.append("profilepic", file);

    try {
      await axios.put(`http://localhost:2005/api/user/${designer._id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <>
      <div className="edit-profile-container">
        <div className="profile-header">
          <h2 style={{ color: "#A4502F " }}>Edit {isClient ? 'Client' : 'Designer'} Profile</h2>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form-compact">
          {/* Profile Picture Section */}
          <div className="profile-pic-section">
            <div className="pic-upload">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="file-input-hidden"
                id="profile-pic-input"
              />
              <label htmlFor="profile-pic-input" className="pic-upload-label">
                {file ? (
                  <img src={URL.createObjectURL(file)} alt="Preview" className="profile-preview-large" />
                ) : designer?.profilepic ? (
                  <img src={`http://localhost:2005${designer.profilepic}`} alt="Current" className="profile-preview-large" />
                ) : (
                  <div className="pic-placeholder">
                    <span className="pic-icon">📷</span>
                    <span className="pic-text">Upload Photo</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Form Grid */}
          <div className="form-grid">
            <div className="form-row">
              <div className="form-group-half">
                <label className="form-label-compact">Full Name</label>
                <input
                  value={full_name}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input-compact"
                  required
                />
              </div>
              {isDesigner && (
                <div className="form-group-half">
                  <label className="form-label-compact">Experience (Years)</label>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="form-input-compact"
                    min="0"
                    placeholder="5"
                  />
                </div>
              )}
            </div>

            {isDesigner ? (
              <div className="form-group-full">
                <label className="form-label-compact">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="form-textarea-compact"
                  placeholder="Brief description of your design philosophy..."
                />
              </div>
            ) : (
              <div className="form-group-full">
                <label className="form-label-compact">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-compact"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            )}
          </div>

          {/* Preference Quiz Section - Only for Designers */}
          {isDesigner && (
            <div className="preference-compact">
              <div className="preference-title">
                <span className="quiz-emoji">🎨</span>
                <span>Design Preferences</span>
                {quizCompleted && <span className="completed-badge">✓</span>}
              </div>

              {quizCompleted ? (
                <div className="quiz-summary-compact">
                  <div className="summary-chips">
                    {specialization && <span className="chip">{specialization}</span>}
                    {approach && <span className="chip">{approach}</span>}
                    {preferredTones.length > 0 && <span className="chip">{preferredTones.length} color{preferredTones.length > 1 ? 's' : ''}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuiz(true)}
                    className="btn-edit-preferences"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="quiz-prompt-compact">
                  <span className="quiz-prompt-text">Complete to help clients find you</span>
                  <button
                    type="button"
                    onClick={() => setShowQuiz(true)}
                    className="btn-take-quiz"
                  >
                    Take Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button type="button" onClick={onClose} className="btn btn-cancel-compact">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-submit-compact"
              disabled={isDesigner && !quizCompleted}
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {showQuiz && isDesigner && (
        <PreferenceQuiz
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
          initialData={{
            specialization,
            approach,
            preferredTones
          }}
        />
      )}
    </>
  );
}