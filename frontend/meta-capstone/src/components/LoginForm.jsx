import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { Link } from "react-router-dom";
import "../styles/LoginForm.css";
import { useNav } from "../contexts/NavContext";
import { Pages } from "../enums.js";

function LoginForm() {
    const { currentPage, setCurrentPage } = useNav();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const { setUser } = useUser();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

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
                setCurrentPage(Pages.HOME);
                navigate("/home"); // Redirect to the homepage
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
        <form onSubmit={handleSubmit} className="login-form">
            <label>
                username
                <input
                    type="text"
                    name="username"
                    placeholder="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
            </label>

            <label>
                password
                <input
                    type="password"
                    name="password"
                    placeholder="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            </label>

            <button type="submit">log in</button>

            {message && (
                <p className={`message ${message.type}`}>{message.text}</p>
            )}

            <p>
                new to skinterest? <Link to="/signup">sign up</Link>
            </p>
        </form>
    );
}

export default LoginForm;
