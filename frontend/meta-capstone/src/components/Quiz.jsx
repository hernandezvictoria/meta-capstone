import { SkinTypes, SkinConcerns } from '../enums';


import { useState, useEffect } from "react";
import { useUser } from '../contexts/UserContext';
import { Link, useParams, useNavigate, Form } from 'react-router-dom';
import '../styles/Quiz.css';
import WithAuth from './WithAuth'

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
            setMessage({ type: "success", text: "form submitted successfully!" });
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
            const response = await fetch("http://localhost:3000/change-skin-type", {
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
            const response = await fetch("http://localhost:3000/change-skin-concerns", {
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
        <>
            <h2>tell us about your skinterests, {user.username}</h2>

            <form onSubmit={handleSubmit}>
                <h3>skin type(s) </h3>
                <input type="checkbox" name="type" id={SkinTypes.OILY} value={SkinTypes.OILY}/>
                <label>{SkinTypes.OILY}</label><br></br>
                <input type="checkbox" name="type" id={SkinTypes.DRY} value={SkinTypes.DRY}/>
                <label>{SkinTypes.DRY}</label><br></br>
                <input type="checkbox" name="type" id={SkinTypes.SENSITIVE} value={SkinTypes.SENSITIVE}/>
                <label>{SkinTypes.SENSITIVE}</label><br></br>
                <input type="checkbox" name="type" id={SkinTypes.COMBINATION} value={SkinTypes.COMBINATION}/>
                <label>{SkinTypes.COMBINATION}</label><br></br>
                <input type="checkbox" name="type" id={SkinTypes.NORMAL} value={SkinTypes.NORMAL}/>
                <label>{SkinTypes.NORMAL}</label><br></br>


                <h3>concern(s)</h3>
                <input type="checkbox" name="concern" id={SkinConcerns.WRINKLES} value={SkinConcerns.WRINKLES}/>
                <label>{SkinConcerns.WRINKLES}</label><br></br>
                <input type="checkbox" name="concern" id={SkinConcerns.TEXTURE} value={SkinConcerns.TEXTURE}/>
                <label>{SkinConcerns.TEXTURE}</label><br></br>
                <input type="checkbox" name="concern" id={SkinConcerns.HYPERPIGMENTATION} value={SkinConcerns.HYPERPIGMENTATION}/>
                <label>{SkinConcerns.HYPERPIGMENTATION}</label><br></br>
                <input type="checkbox" name="concern" id={SkinConcerns.REDNESS} value={SkinConcerns.REDNESS}/>
                <label>{SkinConcerns.REDNESS}</label><br></br>
                <input type="checkbox" name="concern" id={SkinConcerns.ACNE} value={SkinConcerns.ACNE}/>
                <label>{SkinConcerns.ACNE}</label><br></br>
                <input type="checkbox" name="concern" id={SkinConcerns.DULLNESS} value={SkinConcerns.DULLNESS}/>
                <label>{SkinConcerns.DULLNESS}</label><br></br>
                <input type="checkbox" name="concern" id={SkinConcerns.DRYNESS} value={SkinConcerns.DRYNESS}/>
                <label>{SkinConcerns.DRYNESS}</label><br></br>

                {message && (
                <p className={`message ${message.type}`}>{message.text}</p>
                )}

                <button type="submit" value="Submit">submit</button>
            </form>


        </>

    );
};

export default WithAuth(Quiz);
