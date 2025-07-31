import { useState, useEffect } from "react";
import "../../styles/Product.css";
import closedBookmark from "../../assets/closed-bookmark.png";
import openBookmark from "../../assets/open-bookmark.png";
import closedHeart from "../../assets/closed-heart.png";
import openHeart from "../../assets/open-heart.png";
import closedDislike from "../../assets/closed-dislike.png";
import openDislike from "../../assets/open-dislike.png";
import openStar from "../../assets/open-star.png";
import closedStar from "../../assets/closed-star.png";

import { InteractionTypes } from "../../../../../common-enums.js";

function Product({
    likedProducts,
    setLikedProducts,
    savedProducts,
    setSavedProducts,
    dislikedProducts,
    setDislikedProducts,
    routineProducts,
    setRoutineProducts,
    setModalProductId,
    setError,
    id,
    image,
    brand,
    name,
    concerns,
    skin_type,
    score,
    skincareRoutineScore,
}) {
    const [isLoading, setIsLoading] = useState(false);
    const placeholderImage =
        "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg";

    const loadImage = async () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500); // wait 500ms before setting the image to the display image
    };

    useEffect(() => {
        loadImage();
    }, []);

    const logClickInDb = async (interactionType) => {
        try {
            await fetch(
                `${import.meta.env.VITE_BASE_URL}/log-interaction/${id}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ interactionType: interactionType }),
                    credentials: "include",
                }
            );
        } catch (error) {
            setError("an error ocurred when clicking the product");
        }
    };

    const openModal = () => {
        logClickInDb(InteractionTypes.OPEN_MODAL);
        setModalProductId(id);
    };

    const toggleLike = async (event) => {
        event.stopPropagation();
        if (likedProducts.find((p) => p.id === id)) {
            //if product is already liked, remove like
            logClickInDb(InteractionTypes.REMOVE_LIKE);
        } else {
            logClickInDb(InteractionTypes.LIKE);
        }

        try {
            // update liked products in database
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/toggle-like/${id}`,
                { method: "PUT", credentials: "include" }
            );
            const res = await response.json();
            const removedLike = res.removedLike;
            if (removedLike) {
                setLikedProducts(likedProducts.filter((p) => p.id !== id));
            } else {
                setLikedProducts([
                    ...likedProducts,
                    { id, image, brand, name, concerns, skin_type },
                ]);
            }
        } catch (error) {
            setError("error while toggling like");
        }
    };

    const toggleSave = async (event) => {
        event.stopPropagation();
        if (savedProducts.find((p) => p.id === id)) {
            //if product is already saved, remove save
            logClickInDb(InteractionTypes.REMOVE_SAVE);
        } else {
            logClickInDb(InteractionTypes.SAVE);
        }

        try {
            // update saved products in database
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/toggle-save/${id}`,
                { method: "PUT", credentials: "include" }
            );
            const res = await response.json();
            const removedSave = res.removedSave;
            if (removedSave) {
                setSavedProducts(savedProducts.filter((p) => p.id !== id));
            } else {
                setSavedProducts([
                    ...savedProducts,
                    { id, image, brand, name, concerns, skin_type },
                ]);
            }
        } catch (error) {
            setError("error while toggling save");
        }
    };

    const toggleDislike = async (event) => {
        event.stopPropagation();
        if (dislikedProducts.find((p) => p.id === id)) {
            //if product is already disliked, remove dislike
            logClickInDb(InteractionTypes.REMOVE_DISLIKE);
        } else {
            logClickInDb(InteractionTypes.DISLIKE);
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/toggle-dislike/${id}`,
                { method: "PUT", credentials: "include" }
            );
            const res = await response.json();
            const removedDislike = res.removedDislike;
            if (removedDislike) {
                setDislikedProducts(
                    dislikedProducts.filter((p) => p.id !== id)
                );
            } else {
                setDislikedProducts([
                    ...dislikedProducts,
                    { id, image, brand, name, concerns, skin_type },
                ]);
            }
        } catch (error) {
            setError("error while toggling dislike");
        }
    };

    const toggleInRoutine = async (event) => {
        event.stopPropagation();
        try {
            // update skincare routine products in database
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/toggle-add-to-routine/${id}`,
                { method: "PUT", credentials: "include" }
            );
            const res = await response.json();
            const removedFromRoutine = res.removedAdd;
            if (removedFromRoutine) {
                setRoutineProducts(routineProducts.filter((p) => p.id !== id));
            } else {
                setRoutineProducts([
                    ...routineProducts,
                    { id, image, brand, name, concerns, skin_type },
                ]);
            }
        } catch (error) {
            setError("error while toggling add to routine");
        }
    };

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
        <div className="product" onClick={openModal}>
            {isLoading ? (
                <img
                    className="shimmer"
                    alt={name}
                    aria-label={name}
                    src={placeholderImage}
                /> // loading image with shimmering effect
            ) : (
                <img
                    className="product-image"
                    alt={name}
                    aria-label={name}
                    src={image}
                />
            )}

            <section className="product-info">
                <p className="product-brand">{brand}</p>
                <p className="product-name">{name}</p>
                {skincareRoutineScore ? (
                    <p
                        id={getScoreClass(skincareRoutineScore)}
                        className="product-score"
                    >
                        skincare routine score: {skincareRoutineScore}
                    </p>
                ) : (
                    <p id={getScoreClass(score)} className="product-score">
                        score: {score}
                    </p>
                )}
                <p>skin type(s): {skin_type.join(", ")}</p>
                <p>concern(s): {concerns.join(", ")}</p>
            </section>
            <section className="like-and-save">
                <button className="button-wrapper" onClick={toggleLike}>
                    <img
                        className="button-image"
                        src={
                            likedProducts.find((p) => p.id === id)
                                ? closedHeart
                                : openHeart
                        }
                    ></img>
                </button>
                <button className="button-wrapper" onClick={toggleSave}>
                    <img
                        className="button-image"
                        src={
                            savedProducts.find((p) => p.id === id)
                                ? closedBookmark
                                : openBookmark
                        }
                    ></img>
                </button>
                <button className="button-wrapper" onClick={toggleDislike}>
                    <img
                        className="button-image"
                        src={
                            dislikedProducts.find((p) => p.id === id)
                                ? closedDislike
                                : openDislike
                        }
                    ></img>
                </button>
                <button className="button-wrapper" onClick={toggleInRoutine}>
                    <img
                        className="button-image"
                        src={
                            routineProducts.find((p) => p.id === id)
                                ? closedStar
                                : openStar
                        }
                    ></img>
                </button>
            </section>
        </div>
    );
}

export default Product;
