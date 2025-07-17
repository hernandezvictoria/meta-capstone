import { SkinTypes, SkinConcerns} from '../enums';
import { useState, useEffect } from "react";
import { useUser } from '../contexts/UserContext';
import { Link, useParams, useNavigate, Form } from 'react-router-dom';
import '../styles/Quiz.css';
import WithAuth from './WithAuth'
import logoIcon from '../assets/logo.png'

const Quiz = () => {
    const { user, setUser } = useUser();
    const navigate = useNavigate();
    const [message, setMessage] = useState({ type: "none", text: "" });
    const [formSubmitted, setFormSubmitted] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        const form = event.target;
        const selectedSkinTypes = [];
        const selectedConcerns = [];

        // collect selected skin types
        form.querySelectorAll('input[name="type"]:checked').forEach((input) => {
            selectedSkinTypes.push(input.value);
        });

        // collect selected concerns
        form.querySelectorAll('input[name="concern"]:checked').forEach((input) => {
            selectedConcerns.push(input.value);
        });

        if (selectedSkinTypes.length === 0 || selectedConcerns.length === 0) {
            setMessage({ type: "error", text: "you must select at least one of each" });
        } else {
            // setFormSubmitted(true);

            // convert to JSON
            const skinTypesJson = JSON.stringify(selectedSkinTypes);
            const concernsJson = JSON.stringify(selectedConcerns);

            updateUserInfo(skinTypesJson, concernsJson);
        }
    }

    const updateUserInfo = async (skinTypesJson, concernsJson) => {

        //update skin type
        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/change-skin-type`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: skinTypesJson,
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage({ type: "error", text: data.error || "form process failed" });
            }
            else{
                setMessage({type:"success", text:"updated skin type"})
            }
        } catch (error) {
            setMessage({ type: "error", text: "network error, please try again" });
        }

        //update skin concern
        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/change-skin-concerns`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: concernsJson,
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage({ type: "error", text: data.error || "form process failed" });
            }
            else{
                setMessage({type:"success", text:"updated concern"})
            }
        } catch (error) {
            setMessage({ type: "error", text: "network error, please try again" });
        }

        setFormSubmitted(true);
    }

    useEffect(() => {
        if(formSubmitted && message.type !== "error"){
            navigate("/home");
        }

    }, [formSubmitted, message]);

    return (
        <div className="quiz-background">
            <div className="quiz-body">
                <img src={logoIcon} alt="logo" className="logo" />
                <h2 className="quiz-header">tell us about your skinterests, {user.username}</h2>
                <form onSubmit={handleSubmit}>
                    <h3>skin type(s) </h3>
                    {Object.values(SkinTypes).map((skinType) => (
                        <div key={skinType}>
                            <input type="checkbox" name="type" id={skinType} value={skinType}/>
                            <label>{skinType}</label><br></br>
                        </div>
                    ))}


                    <h3>concern(s)</h3>
                    {Object.values(SkinConcerns).map((concern) => (
                        <div key={concern}>
                            <input type="checkbox" name="concern" id={concern} value={concern}/>
                            <label>{concern}</label><br></br>
                        </div>
                    ))}

                    {message && (
                    <p className={`message ${message.type}`}>{message.text}</p>
                    )}

                    <button type="submit" value="Submit">submit</button>
                </form>
            </div>


        </div>

    );
};

export default WithAuth(Quiz);
