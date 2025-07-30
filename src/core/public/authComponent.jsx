
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import illustration from "../../assets/images/authIllustration.png";
import logo from "../../assets/images/logo.png";
import ChangePasswordModal from "../../components/changePassword"; // Add this import
import Toast from "../../components/toastMessage";
import { useAuth } from "../../provider/authcontext";

const calculatePasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    if (!password) return { score: 0, strength: 'Very Weak', feedback: ['Enter a password'] };

    // Length scoring
    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else if (password.length >= 6) score += 10;
    else feedback.push("Use at least 8 characters");

    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push("Add lowercase letters");

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push("Add uppercase letters");

    if (/\d/.test(password)) score += 15;
    else feedback.push("Add numbers");

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;
    else feedback.push("Add special characters (!@#$%^&*)");

    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 10;

    // Common pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // repeated characters
    if (/123456|abcdef|qwerty|password/i.test(password)) score -= 15; // common patterns

    let strength = 'Very Weak';
    let color = '#ef4444'; // red

    if (score >= 85) {
        strength = 'Very Strong';
        color = '#22c55e'; // green
    } else if (score >= 70) {
        strength = 'Strong';
        color = '#84cc16'; // lime
    } else if (score >= 50) {
        strength = 'Medium';
        color = '#eab308'; // yellow
    } else if (score >= 30) {
        strength = 'Weak';
        color = '#f97316'; // orange
    }

    return { score: Math.max(0, Math.min(100, score)), strength, feedback, color };
};

export default function AuthPopup({ onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false); // Add this state

    // Toast state
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "info"
    });

    const { login } = useAuth();

    // Password strength for signup
    const passwordStrength = !isLogin ? calculatePasswordStrength(password) : null;

    // Show toast message with auto-dismiss
    const showToast = (message, type = "info") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    // Handle forgot password click
    const handleForgotPassword = () => {
        setShowChangePassword(true);
    };

    // Handle change password modal close
    const handleChangePasswordClose = () => {
        setShowChangePassword(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation
        if (!email || !password) {
            return showToast("Please fill in all fields", "error");
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:2005/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Show specific error message from server or a generic one
                throw new Error(data.errors ? data.errors[0] : "Login failed");
            }

            // Successfully logged in - use auth context login method
            login(data._id, data.role);

            // Store token if provided
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            showToast(`Welcome back, ${data.full_name}!`, "success");

            // Close popup after a brief delay to show success message
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            console.error("Login error:", err);
            showToast(err.message || "An unexpected error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        // Enhanced validation
        if (!email || !fullName || !password) {
            return showToast("Please fill in all required fields", "error");
        }

        if (password !== confirmPassword) {
            return showToast("Passwords do not match", "error");
        }

        // Check password strength
        if (passwordStrength.score < 50) {
            return showToast("Please choose a stronger password", "error");
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:2005/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    full_name: fullName.trim(),
                    password,
                    role: "client",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.errors ? data.errors[0] : "Signup failed");
            }

            showToast("Account created successfully! You can now log in.", "success");

            setTimeout(() => {
                setIsLogin(true);
                setFullName("");
                setPassword("");
                setConfirmPassword("");
            }, 1500);

        } catch (err) {
            console.error("Signup error:", err);
            showToast(err.message || "An unexpected error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", }} className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 px-4">
                <div style={{ padding: "10px" }} className="bg-[#FCFCEC] border border-[#C2805A] rounded-xl shadow-[0_0_35px_rgba(0,0,0,0.3)] w-200 h-120 flex flex-col md:flex-row overflow-hidden relative items-center justify-center">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-2xl text-gray-700 hover:text-black font-bold z-10"
                    >
                        &times;
                    </button>

                    {/* Left Illustration */}
                    <div className="hidden md:flex md:w-[58%] items-center justify-center">
                        <img
                            src={illustration}
                            alt="Background"
                            className="w-200 object-contain"
                            style={{ maxHeight: "510px", marginLeft: "40px", marginRight: "0px", padding: "20px" }}
                        />
                    </div>

                    {/* Right Auth Content */}
                    <div className="w-full md:w-[60%] p-10 flex flex-col items-center justify-center" style={{ paddingTop: "25px" }}>

                        {/* Enhanced Toggle Buttons with Sliding Indicator */}
                        <div className="auth-tab-container">
                            <div className="auth-tab-list">
                                <motion.div
                                    className="auth-tab-indicator"
                                    animate={{ x: isLogin ? 0 : '100%' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                                <button
                                    className={`auth-tab ${isLogin ? 'auth-tab-active' : 'auth-tab-inactive'}`}
                                    onClick={() => setIsLogin(true)}
                                >
                                    Login
                                </button>
                                <button
                                    className={`auth-tab ${!isLogin ? 'auth-tab-active' : 'auth-tab-inactive'}`}
                                    onClick={() => setIsLogin(false)}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>

                        {/* Form Content with Fixed Height */}
                        <div className="w-full max-w-sm form-container">
                            <AnimatePresence mode="wait">
                                {isLogin ? (
                                    <motion.div
                                        key="login"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="form-content"
                                    >
                                        <form onSubmit={handleLogin} className="form-fields">
                                            <div className="input-group">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="E-mail"
                                                    style={{ padding: "6px 12px", width: "290px" }}
                                                    className="text-[#BE7B5D] rounded-md border border-gray-300 bg-[#f7f0e9]"
                                                    disabled={loading}
                                                />
                                            </div>

                                            <div className="input-group">
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Password"
                                                    style={{ padding: "6px 12px", width: "290px" }}
                                                    className="text-[#BE7B5D] rounded-md border border-gray-300 bg-[#f7f0e9]"
                                                    disabled={loading}
                                                />
                                            </div>

                                            <div className="button-group">
                                                <button
                                                    type="submit"
                                                    style={{ padding: "6px 12px", width: "130px" }}
                                                    className="bg-[#C2805A] text-white py-2 rounded-md font-semibold disabled:opacity-50"
                                                    disabled={loading}
                                                >
                                                    {loading ? "LOGGING IN..." : "LOGIN"}
                                                </button>
                                            </div>

                                            <div className="forgot-password">
                                                <p
                                                    className="forgot-password-link"
                                                    onClick={handleForgotPassword}
                                                >
                                                    Forgot Password?
                                                </p>
                                            </div>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="signup"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="form-content"
                                    >
                                        <form onSubmit={handleSignup} className="form-fields">
                                            <div className="input-group">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="E-mail"
                                                    style={{ padding: "6px 12px", width: "290px" }}
                                                    className="text-[#BE7B5D] rounded-md border border-gray-300 bg-[#f7f0e9]"
                                                    disabled={loading}
                                                />
                                            </div>

                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="Full Name"
                                                    style={{ padding: "6px 12px", width: "290px" }}
                                                    className="text-[#BE7B5D] rounded-md border border-gray-300 bg-[#f7f0e9]"
                                                    disabled={loading}
                                                />
                                            </div>

                                            {/* Password with strength indicator */}
                                            <div className="input-group password-input-group">
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Password"
                                                    style={{ padding: "6px 12px", width: "290px" }}
                                                    className="text-[#BE7B5D] rounded-md border border-gray-300 bg-[#f7f0e9]"
                                                    disabled={loading}
                                                />

                                                {/* Password Strength Indicator */}
                                                {password && (
                                                    <div className="password-strength-container">
                                                        <div className="strength-bar-bg">
                                                            <motion.div
                                                                className="strength-bar-fill"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${passwordStrength.score}%` }}
                                                                transition={{ duration: 0.3 }}
                                                                style={{ backgroundColor: passwordStrength.color }}
                                                            />
                                                        </div>
                                                        <div className="strength-info">
                                                            <span
                                                                className="strength-label"
                                                                style={{ color: passwordStrength.color }}
                                                            >
                                                                {passwordStrength.strength}
                                                            </span>
                                                            {passwordStrength.feedback.length > 0 && (
                                                                <div className="strength-feedback">
                                                                    {passwordStrength.feedback.slice(0, 2).map((tip, index) => (
                                                                        <span key={index} className="feedback-tip">{tip}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="input-group">
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm Password"
                                                    style={{ padding: "6px 12px", width: "290px" }}
                                                    className="text-[#BE7B5D] rounded-md border border-gray-300 bg-[#f7f0e9]"
                                                    disabled={loading}
                                                />
                                            </div>

                                            <div className="button-group">
                                                <button
                                                    type="submit"
                                                    style={{ padding: "6px 12px", width: "180px" }}
                                                    className="bg-[#C2805A] text-white py-2 rounded-md font-semibold disabled:opacity-50"
                                                    disabled={loading || (password && passwordStrength.score < 50)}
                                                >
                                                    {loading ? "SIGNING UP..." : "SIGN UP"}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Toast component */}
                <AnimatePresence>
                    {toast.show && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Toast message={toast.message} type={toast.type} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <style jsx>{`
                    .auth-tab-container {
                        display: flex;
                        justify-content: center;
                        padding: 0;
                    }

                    .auth-tab-list {
                        background: #f3f4f6;
                        border-radius: 12px;
                        padding: 2px;
                        display: flex;
                        position: relative;
                        min-width: 290px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }

                    .auth-tab-indicator {
                        position: absolute;
                        top: 4px;
                        left: 4px;
                        width: calc(50% - 4px);
                        height: calc(100% - 8px);
                        background: #C2805A;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(194, 128, 90, 0.3);
                        z-index: 1;
                    }

                    .auth-tab {
                        flex: 1;
                        padding: 12px 20px;
                        border-radius: 8px;
                        border: none;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        white-space: nowrap;
                        font-family: inherit;
                        position: relative;
                        z-index: 2;
                        background: transparent;
                    }

                    .auth-tab-active {
                        color: white !important;
                    }

                    .auth-tab-inactive {
                        color: #6b7280;
                    }

                    .auth-tab-inactive:hover {
                        color: #374151;
                    }

                    .auth-tab:focus {
                        outline: none;
                    }

                    .form-container {
                        min-height: 260px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .form-content {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .form-fields {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 20px;
                        margin: 30px;
                    }

                    .input-group {
                        width: 100%;
                        max-width: 320px;
                        display: flex;
                        flex-direction: column;
                    }

                    .password-input-group {
                        gap: 12px;
                    }

                    .form-input {
                        width: 100%;
                        padding: 14px 16px;
                        border-radius: 10px;
                        border: 2px solid #e5e7eb;
                        background: #fafafa;
                        color: #BE7B5D;
                        font-size: 15px;
                        font-weight: 500;
                        transition: all 0.3s ease;
                        box-sizing: border-box;
                    }

                    .form-input:focus {
                        outline: none;
                        border-color: #C2805A;
                        background: #ffffff;
                        box-shadow: 0 0 0 3px rgba(194, 128, 90, 0.1);
                    }

                    .form-input:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .form-input::placeholder {
                        color: #9ca3af;
                        font-weight: 400;
                    }

                    .button-group {
                        width: 100%;
                        max-width: 320px;
                        display: flex;
                        justify-content: center;
                        margin-top: 8px;
                    }

                    .form-button {
                        background: #C2805A;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        padding: 14px 32px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        min-width: 160px;
                        transition: all 0.3s ease;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .form-button:hover:not(:disabled) {
                        background: #a66a4a;
                        transform: translateY(-1px);
                        box-shadow: 0 6px 12px rgba(194, 128, 90, 0.4);
                    }

                    .form-button:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none;
                        box-shadow: none;
                    }

                    .forgot-password {
                        width: 100%;
                        max-width: 320px;
                        display: flex;
                        justify-content: center;
                        margin-top: 4px;
                    }

                    .forgot-password-link {
                        color: #C2805A;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: center;
                    }

                    .forgot-password-link:hover {
                        text-decoration: underline;
                        color: #a66a4a;
                    }

                    .password-strength-container {
                        width: 100%;
                    }

                    .strength-bar-bg {
                        width: 100%;
                        height: 6px;
                        background-color: #e5e7eb;
                        border-radius: 3px;
                        overflow: hidden;
                        margin-bottom: 8px;
                    }

                    .strength-bar-fill {
                        height: 100%;
                        border-radius: 3px;
                    }

                    .strength-info {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        font-size: 12px;
                    }

                    .strength-label {
                        font-weight: 600;
                        font-size: 13px;
                    }

                    .strength-feedback {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                        gap: 2px;
                        max-width: 60%;
                    }

                    .feedback-tip {
                        color: #6b7280;
                        font-size: 11px;
                        text-align: right;
                        line-height: 1.3;
                    }
                `}</style>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={handleChangePasswordClose}
            />
        </>
    );
}