import "../../styles/RoutinePage.css";
import WithAuth from "../WithAuth";
import NavBar from "../NavBar";
import { useUser } from "../../contexts/UserContext";
import { useState, useEffect, use } from "react";
import Loading from "../home_components/Loading";
import RoutineProductList from "./RoutineProductList";
import CacheStats from "../CacheStats";

function RoutinePage() {
    const { user } = useUser();
    const [routine, setRoutine] = useState([]);
    const [routineScore, setRoutineScore] = useState([]);
    const [routineMessage, setRoutineMessage] = useState(true);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [likedProducts, setLikedProducts] = useState([]);
    const [savedProducts, setSavedProducts] = useState([]);
    const [dislikedProducts, setDislikedProducts] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRoutine = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/user-routine-and-recommendations`,
                { credentials: "include" }
            );
            const res = await response.json();
            setRoutine(res.currentSkincareRoutine);
            setRoutineScore(res.currentSkincareRoutineScore);
            setRoutineMessage(res.message);
            setSuggestedProducts(res.suggestedProducts);
        } catch (error) {
            setError("failed to fetch skincare routine, please try again");
        }
    };

    const fetchLikedSavedDisliked = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/user-liked-saved-disliked`,
                { credentials: "include" }
            );
            const res = await response.json();
            setLikedProducts(res.loved_products);
            setSavedProducts(res.saved_products);
            setDislikedProducts(res.disliked_products);
        } catch (error) {
            setError("unable to fetch liked, saved, and disliked products");
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        await fetchRoutine();
        await fetchLikedSavedDisliked();
        setTimeout(() => setIsLoading(false), 300);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getScoreClass = (score) => {
        const scoreNum = parseFloat(score);
        if (scoreNum <= 1.5) {
            return "score-1";
        } else if (scoreNum <= 3) {
            return "score-2";
        } else if (scoreNum <= 4.5) {
            return "score-3";
        } else if (scoreNum <= 6) {
            return "score-4";
        } else if (scoreNum <= 7.5) {
            return "score-5";
        } else if (scoreNum <= 9) {
            return "score-6";
        } else {
            return "score-7";
        }
    };

    return (
        <>
            <NavBar />
            <div className="main-content">
                <p className="greeting">hello, {user.username}</p>
                <h1>skinterest</h1>

                {isLoading ? (
                    <Loading />
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <div className="body">
                        <div className="current-routine">
                            <h2 className="routine-header">
                                your current skincare routine
                            </h2>
                            <RoutineProductList
                                isSuggestedProducts={false}
                                displayData={routine}
                                likedProducts={likedProducts}
                                setLikedProducts={setLikedProducts}
                                savedProducts={savedProducts}
                                setSavedProducts={setSavedProducts}
                                dislikedProducts={dislikedProducts}
                                setDislikedProducts={setDislikedProducts}
                                routineProducts={routine}
                                setRoutineProducts={setRoutine}
                                setError={setError}
                            />
                            <div className="score-and-message">
                                <h2
                                    className="routine-score"
                                    id={getScoreClass(routineScore)}
                                >
                                    overall score: {routineScore}/10
                                </h2>
                                <h2 className="message">{routineMessage}</h2>
                            </div>
                        </div>
                        <div className="suggested-products">
                            <h2 className="suggested-products-header">
                                consider these products for your routine
                            </h2>
                            <RoutineProductList
                                isSuggestedProducts={true}
                                displayData={suggestedProducts}
                                likedProducts={likedProducts}
                                setLikedProducts={setLikedProducts}
                                savedProducts={savedProducts}
                                setSavedProducts={setSavedProducts}
                                dislikedProducts={dislikedProducts}
                                setDislikedProducts={setDislikedProducts}
                                routineProducts={routine}
                                setRoutineProducts={setRoutine}
                                setError={setError}
                            />
                        </div>
                    </div>
                )}
            </div>
            <CacheStats />
        </>
    );
}

export default WithAuth(RoutinePage);
