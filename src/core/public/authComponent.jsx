import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import illustration from "../../assets/images/authIllustration.png";
import logo from "../../assets/images/logo.png";
import Toast from "../../components/toastMessage"; // Import the Toast component
import { useAuth } from "../../provider/authcontext";

export default function AuthPopup({ onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState(""); // only for signup
    const [confirmPassword, setConfirmPassword] = useState(""); // optional for signup

    // Toast state
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "info"
    });

    const { login } = useAuth();

    // Show toast message with auto-dismiss
    const showToast = (message, type = "info") => {
        setToast({ show: true, message, type });

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation
        if (!email || !password) {
            return showToast("Please fill in all fields", "error");
        }

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

            // Successfully logged in
            login(data._id, data.role);
            showToast(`Welcome back, ${data.full_name}!`, "success");

            // Close popup after a brief delay to show success message
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            console.error("Login error:", err);
            showToast(err.message || "An unexpected error occurred", "error");
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        // Validation
        if (!email || !fullName || !password) {
            return showToast("Please fill in all required fields", "error");
        }

        if (password !== confirmPassword) {
            return showToast("Passwords do not match", "error");
        }

        if (password.length < 8) {
            return showToast("Password must be at least 8 characters", "error");
        }

        try {
            const res = await fetch("http://localhost:2005/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    full_name: fullName,
                    password,
                    role: "client",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Show specific error from server or a generic one
                throw new Error(data.errors ? data.errors[0] : "Signup failed");
            }

            // Successfully signed up
            showToast("Account created successfully! You can now log in.", "success");

            // Switch to login tab after successful signup
            setTimeout(() => {
                setIsLogin(true);
                // Clear form fields
                setFullName("");
                setPassword("");
                setConfirmPassword("");
            }, 1500);

        } catch (err) {
            console.error("Signup error:", err);
            showToast(err.message || "An unexpected error occurred", "error");
        }
    };

    return (
        <div style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", }} className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div style={{ padding: "10px" }} className="bg-[#FCFCEC] border border-[#C2805A] rounded-xl shadow-[0_0_35px_rgba(0,0,0,0.3)] w-180 h-120 flex  flex-col md:flex-row overflow-hidden relative items-center justify-center ">

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
                        className="w-200  object-contain"
                        style={{ maxHeight: "510px", marginLeft: "20px", marginRight: "0px" }}
                    />
                </div>

                {/* Right Auth Content */}
                <div className="w-full md:w-[60%] p-8 flex flex-col items-center justify-center " style={{}}>
                    <div className="">
                        <img
                            src={logo}
                            alt="Background"
                            className="w-50 object-contain"
                            style={{ maxHeight: "30px", marginBottom: "5px" }}
                        />
                    </div>


                    {/* Toggle Buttons */}
                    <div className="flex gap-2 mb-6" style={{ padding: "12px", justifyContent: "center" }}>
                        <button style={{ padding: "5px 12px" }}
                            className={`px-6 py-2 rounded-md text-md font-semibold transition ${isLogin
                                ? "bg-[#C2805A] text-white"
                                : "bg-[#f7f0e9] text-[#C2805A]"
                                }`}
                            onClick={() => setIsLogin(true)}
                        >
                            Login
                        </button>
                        <button style={{ padding: "5px 12px" }}
                            className={`px-6 py-2 rounded-md text-md font-semibold transition ${!isLogin
                                ? "bg-[#C2805A] text-white"
                                : "bg-[#f7f0e9] text-[#C2805A]"
                                }`}
                            onClick={() => setIsLogin(false)}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="w-full max-w-sm min-h-[270px] flex flex-col justify-center items-center" style={{ paddingRight: "0", paddingLeft: "0", marginRight: "0", marginLeft: "0" }}>
                        <AnimatePresence mode="wait">
                            {isLogin ? (
                                <motion.div
                                    key="login"
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -100, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <form onSubmit={handleLogin} className="flex flex-col gap-6  justify-center items-center">
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "5px 12px", marginTop: "-30px", width: "290px" }}
                                            placeholder="E-mail"
                                            className="text-[#BE7B5D]  rounded-md border border-gray-300 bg-[#f7f0e9]"
                                        />
                                        <input style={{ padding: "5px 12px", width: "290px" }}
                                            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className="text-[#BE7B5D] p-3 rounded-md border border-gray-300 bg-[#f7f0e9]"
                                        />
                                        <button style={{ padding: "4px 12px", width: "130px" }}
                                            type="submit"
                                            className="bg-[#C2805A] text-white py-2 rounded-md font-semibold"
                                        >
                                            LOGIN
                                        </button>
                                        <p className="text-sm text-center mt-1 text-[#C2805A] cursor-pointer hover:underline">
                                            Forgot Password?
                                        </p>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signup"
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 100, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <form onSubmit={handleSignup} className="flex flex-col gap-6  justify-center items-center">
                                        <input style={{ padding: "4px 12px", marginTop: "-40px", width: "305px" }}
                                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            placeholder="E-mail"
                                            className="text-[#BE7B5D] p-3 rounded-md border border-gray-300 bg-[#f7f0e9]"
                                        />
                                        <input style={{ padding: "4px 12px", width: "305px" }}
                                            type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Full Name"
                                            className="text-[#BE7B5D] p-3 rounded-md border border-gray-300 bg-[#f7f0e9]"
                                        />
                                        <div className="flex gap-3  justify-between">
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Password"
                                                className="p-3 rounded-md border text-[#BE7B5D] border-gray-300 bg-[#f7f0e9] w-1/2"
                                                style={{ padding: "4px 12px", width: "147px" }}
                                            />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm Password"
                                                className="p-3 rounded-md border text-[#BE7B5D] border-gray-300 bg-[#f7f0e9] w-1/2"
                                                style={{ padding: "4px 12px", width: "147px" }}
                                            />
                                        </div>
                                        <button
                                            style={{ padding: "4px 12px", width: "180px" }}
                                            type="submit"
                                            className="bg-[#C2805A] text-white py-2 rounded-md font-semibold"
                                        >
                                            SIGN UP
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Toast component - only shown when toast.show is true */}
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
        </div>
    );
}