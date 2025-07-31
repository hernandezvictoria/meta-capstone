import { useState } from "react";
import "../styles/SignupForm.css";
import { Link, useParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import logoIcon from "../assets/logo.png";

function SignupForm() {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [message, setMessage] = useState("");
    const { setUser } = useUser();
    const navigate = useNavigate();

    // Handle input changes
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/signup`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (response.ok) {
                login();
            } else {
                setMessage({
                    type: "error",
                    text: data.error || "signup failed.",
                });
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: "network error, please try again.",
            });
        }
    };

    const login = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/login`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "login successful!" });
                setUser(data); // Set the user in context with id and username
                navigate("/quiz"); // Redirect to the quiz page
            } else {
                setMessage({
                    type: "error",
                    text: data.error || "login failed",
                });
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: "network error, please try again",
            });
        }
    };

    return (
        <div className="background">
            <h1 className="login-message">log in to get your ideas</h1>
            <div className="form-body">
                <img src={logoIcon} alt="logo" className="logo" />
                <h2 className="quiz-header">welcome to skinterest</h2>
                <form className="signup-form" onSubmit={handleSubmit}>
                    <label className="input">
                        username
                        <input
                            className="text-box"
                            type="text"
                            name="username"
                            placeholder="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="input">
                        password
                        <input
                            className="text-box"
                            type="password"
                            name="password"
                            placeholder="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <button className="signup-button" type="submit">sign up</button>
                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <p>
                        already a member? <Link className="link" to="/login">log in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default SignupForm;
