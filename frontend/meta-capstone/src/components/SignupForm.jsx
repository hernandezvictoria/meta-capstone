import { useState } from "react"
import '../styles/SignupForm.css'
import { Link, useParams } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from "react-router-dom";

const SignupForm = () => {
    const [formData, setFormData] = useState({ username: "", password: "", })
    const [message, setMessage] = useState("")
    const { setUser } = useUser();
    const navigate = useNavigate();

    // Handle input changes
    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }))
    }

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevents page refresh
        console.log("User Input:", formData); // Logs user input

        try {
            const response = await fetch("http://localhost:3000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: "success", text: "signup successful!" })
                setUser(data); // Set the user in context with id and username
                navigate("/home"); // Redirect to the homepage

            } else {
                setMessage({ type: "error", text: data.error || "signup failed." })
            }
        } catch (error) {
            setMessage({ type: "error", text: "network error, please try again." })
        }
    }

    return (
        <form className="signup-form" onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
            />
            <label htmlFor="password">Password</label>
            <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
            />
            <div className="form-buttons">
                <button type="submit">Sign Up</button>
            </div>
            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <p>already a member? <Link to="/login">log in</Link></p>
        </form>
    )
}

export default SignupForm
