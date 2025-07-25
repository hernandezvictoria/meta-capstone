import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import "../styles/Quiz.css";
import WithAuth from "./WithAuth";
import logoIcon from "../assets/logo.png";
import { useNav } from "../contexts/NavContext";
import { SkinTypes, SkinConcerns, Pages } from "../../../../common-enums.js";

function Quiz() {
    const { setCurrentPage } = useNav();
    const { user } = useUser();
    const navigate = useNavigate();
    const [message, setMessage] = useState({ type: "none", text: "" });
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [selectedSkinTypes, setSelectedSkinTypes] = useState([]);
    const [selectedConcerns, setSelectedConcerns] = useState([]);

    const loadInitialTypesAndConcerns = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/user-skin-types-and-concerns`,
                { credentials: "include" }
            );
            if (response.ok) {
                const data = await response.json();
                setSelectedSkinTypes(data.skinTypes);
                setSelectedConcerns(data.concerns);

                for (const skinType of data.skinTypes) {
                    document.getElementById(skinType).classList.add("active");
                }
                for (const concern of data.concerns) {
                    document
                        .getElementById(concern.replace(/[\s_&()]+/g, ""))
                        .classList.add("active");
                }
            } else {
                throw new Error(); // throw error to be caught
            }
        } catch (error) {
            setCurrentPage(Pages.HOME);
            navigate("/login"); // redirect to login page if error occurs
        }
    };

    useEffect(() => {
        loadInitialTypesAndConcerns();
    }, []); // load initial types and concerns on page load

    const handleSkinTypeClick = (event) => {
        event.preventDefault();
        const skinType = event.target.name;
        const button = document.getElementById(skinType);
        if (selectedSkinTypes.includes(skinType)) {
            // remove if already selected
            setSelectedSkinTypes(
                selectedSkinTypes.filter((type) => type !== skinType)
            );
            button.classList.remove("active");
        } else {
            // add if not selected
            setSelectedSkinTypes([...selectedSkinTypes, skinType]);
            button.classList.add("active");
        }
    };

    const handleConcernClick = (event) => {
        event.preventDefault();
        const concern = event.target.name;
        const button = document.getElementById(
            concern.replace(/[\s_&()]+/g, "")
        );
        if (selectedConcerns.includes(concern)) {
            // remove if already selected
            setSelectedConcerns(selectedConcerns.filter((c) => c !== concern));
            button.classList.remove("active");
        } else {
            // add if not selected
            setSelectedConcerns([...selectedConcerns, concern]);
            button.classList.add("active");
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (selectedSkinTypes.length === 0 || selectedConcerns.length === 0) {
            setMessage({
                type: "error",
                text: "you must select at least one of each",
            });
        } else {
            // convert to JSON
            const skinTypesJson = JSON.stringify(selectedSkinTypes);
            const concernsJson = JSON.stringify(selectedConcerns);
            updateUserInfo(skinTypesJson, concernsJson);
        }
    };

    const updateUserInfo = async (skinTypesJson, concernsJson) => {
        //update skin type
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/change-skin-type`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: skinTypesJson,
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage({
                    type: "error",
                    text: data.error || "form process failed",
                });
            } else {
                setMessage({ type: "success", text: "updated skin type" });
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: "network error, please try again",
            });
        }

        //update skin concern
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/change-skin-concerns`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: concernsJson,
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage({
                    type: "error",
                    text: data.error || "form process failed",
                });
            } else {
                setMessage({ type: "success", text: "updated concern" });
            }
        } catch (error) {
            setMessage({
                type: "error",
                text: "network error, please try again",
            });
        }
        setFormSubmitted(true);
    };

    useEffect(() => {
        if (formSubmitted && message.type !== "error") {
            setCurrentPage(Pages.HOME);
            navigate("/home");
        }
    }, [formSubmitted, message]);

    return (
        <div className="quiz-background">
            <div className="quiz-body">
                <img src={logoIcon} alt="logo" className="logo" />
                <h2 className="quiz-header">
                    tell us about your skinterests, {user.username}
                </h2>
                <form onSubmit={handleSubmit}>
                    <h3 className="category-header">skin type(s) </h3>
                    <div className="skin-type-buttons">
                        {Object.values(SkinTypes).map((skinType) => (
                            <button
                                id={skinType}
                                className="skin-type-button"
                                onClick={handleSkinTypeClick}
                                key={skinType}
                                name={skinType}
                            >
                                {skinType}
                            </button>
                        ))}
                    </div>

                    <h3 className="category-header">concern(s)</h3>
                    <div className="concern-buttons">
                        {Object.values(SkinConcerns).map((concern) => (
                            <button
                                id={concern.replace(/[\s_&()]+/g, "")}
                                className="concern-button"
                                onClick={handleConcernClick}
                                key={concern}
                                name={concern}
                            >
                                {concern}
                            </button>
                        ))}
                    </div>

                    {message && (
                        <p className={`message ${message.type}`}>
                            {message.text}
                        </p>
                    )}

                    <button
                        type="submit"
                        value="Submit"
                        className="submit-button"
                    >
                        submit
                    </button>
                </form>
            </div>
        </div>
    );
}

export default WithAuth(Quiz);
