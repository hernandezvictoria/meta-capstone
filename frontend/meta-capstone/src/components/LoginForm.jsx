import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { Link } from "react-router-dom";
import "../styles/LoginForm.css";
import { useNav } from "../contexts/NavContext";
import { Pages } from "../../../../common-enums.js";
import logoIcon from "../assets/logo.png";

function LoginForm() {
    const { setCurrentPage } = useNav();
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
                navigate("/home");
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
                <h2 className="quiz-header">
                    welcome to skinterest
                </h2>
                <form onSubmit={handleSubmit} className="login-form">
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

                    <button className="login-button" type="submit">log in</button>

                    {message && (
                        <p className={`message ${message.type}`}>
                            {message.text}
                        </p>
                    )}

                    <p>
                        new to skinterest? <Link className="link" to="/signup">sign up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginForm;
