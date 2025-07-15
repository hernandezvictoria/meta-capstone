import React from "react";
import {useState, useEffect} from 'react';
import "../../styles/Product.css";
import closedBookmark from "../../assets/closed-bookmark.png";
import openBookmark from "../../assets/open-bookmark.png";
import closedHeart from "../../assets/closed-heart.png";
import openHeart from "../../assets/open-heart.png";
import closedDislike from "../../assets/closed-dislike.png";
import openDislike from "../../assets/open-dislike.png";
import { InteractionTypes } from "../../enums";

function Product({likedProducts, setLikedProducts, savedProducts, setSavedProducts, dislikedProducts, setDislikedProducts, setModalProductId, setError, id, image, brand, name, concerns, skin_type, score}) {

  const [displayImage, setDisplayImage] = useState(image);
  const [isLoading, setIsLoading] = useState(false);
  const placeholderImage = "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg";

  const loadImage = async () => {
    // if image is not in DB
    if(!image){
      setIsLoading(true);
      console.error("image does not exist in db"); // throw error to be caught, sets display image to placeholder
      const url = `https://real-time-sephora-api.p.rapidapi.com/search-by-keyword?sortBy=BEST_SELLING&keyword=${name}&brandFilter=${brand}`;
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': import.meta.env.VITE_API_KEY,
          'x-rapidapi-host': 'real-time-sephora-api.p.rapidapi.com'
        }
      };

      fetch(url, options)
      .then((response) => response.json())
      .then((res) => {
        const products_list = res.data.products;
        if(products_list.length === 0){
          throw new Error("no products in products list"); // throw error to be caught, sets display image to placeholder
        }
        const fetchedImage = products_list[0].heroImage;
        setDisplayImage(fetchedImage);
        updateImageInDb(fetchedImage);
      })
      .catch((error) => {
        setDisplayImage(placeholderImage);
        updateImageInDb(placeholderImage);
      })
      .finally(() => {
        setTimeout(() => setIsLoading(false), 500);
      });
    }
  }

  const updateImageInDb = async(image) => {
    fetch(`${import.meta.env.VITE_BASE_URL}/change-product-image/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({image: image}),
        credentials: "include",
    })
    .catch((error) => setError("an error ocurred while fetching the product image"));
  }

  useEffect(() => {
    loadImage();
      }, [])

  const logClickInDb = async(interactionType) => {
      fetch(`${import.meta.env.VITE_BASE_URL}/log-interaction/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({interactionType: interactionType}),
        credentials: "include",
    })
    .catch((error) => setError("an error ocurred when clicking the product"));
  }

  const openModal = () => {
    logClickInDb(InteractionTypes.OPEN_MODAL);
    setModalProductId(id);
  }

  const toggleLike = async(event) => {
    event.stopPropagation();
    if(likedProducts.find(p => p.id === id)){ //if product is already liked, remove like
      logClickInDb(InteractionTypes.REMOVE_LIKE);
    }
    else{
      logClickInDb(InteractionTypes.LIKE);
    }

    fetch(`${import.meta.env.VITE_BASE_URL}/toggle-like/${id}`,
      {method: "PUT",
      credentials: "include"})
    .then((response) => response.json())
    .then((res) => {
      const removedLike = res.removedLike;

      if(removedLike){
        setLikedProducts(likedProducts.filter(p => p.id !== id));
      }
      else{
        setLikedProducts([...likedProducts,
          { id, image, brand, name, concerns, skin_type}]);
      }
    })
    .catch((error) => setError("error while toggling like"));
  }

  const toggleSave = async(event) => {
    event.stopPropagation();
    if(savedProducts.find(p => p.id === id)){ //if product is already saved, remove save
      logClickInDb(InteractionTypes.REMOVE_SAVE);
    }
    else{
      logClickInDb(InteractionTypes.SAVE);
    }

    fetch(`${import.meta.env.VITE_BASE_URL}/toggle-save/${id}`,
      {method: "PUT",
      credentials: "include"})
    .then((response) => response.json())
    .then((res) => {
      const removedSave = res.removedSave;

      if(removedSave){
        setSavedProducts(savedProducts.filter(p => p.id !== id));
      }
      else{
        setSavedProducts([...savedProducts,
          { id, image, brand, name, concerns, skin_type}]);
      }
    })
    .catch((error) => setError("error while toggling save"));
  }

  const toggleDislike = async(event) => {
    event.stopPropagation();
    if(dislikedProducts.find(p => p.id === id)){ //if product is already disliked, remove dislike
      logClickInDb(InteractionTypes.REMOVE_DISLIKE);
    }
    else{
      logClickInDb(InteractionTypes.DISLIKE);
    }

    fetch(`${import.meta.env.VITE_BASE_URL}/toggle-dislike/${id}`,
      {method: "PUT",
      credentials: "include"})
    .then((response) => response.json())
    .then((res) => {
      const removedDislike = res.removedDislike;

      if(removedDislike){
        setDislikedProducts(dislikedProducts.filter(p => p.id !== id));
      }
      else{
        setDislikedProducts([...dislikedProducts,
          { id, image, brand, name, concerns, skin_type}]);
      }
    })
    .catch((error) => setError("error while toggling dislike"));
  }

  const getScoreClass = (score) => {
    const scoreNum = parseFloat(score);
    if(scoreNum <= 1.5){
      return "score-1";
    }
    else if(scoreNum <= 3){
      return "score-2";
    }
    else if(scoreNum <= 4.5){
      return "score-3";
    }
    else if(scoreNum <= 6){
      return "score-4";
    }
    else if(scoreNum <= 7.5){
      return "score-5";
    }
    else if(scoreNum <= 9){
      return "score-6";
    }
    else {
      return "score-7";
    }
  }

  return (
    <div className="product" onClick={openModal}>
      { isLoading
        ? <img className="shimmer" alt={name} aria-label={name} src={placeholderImage}/> // loading image with shimmering effect
        : <img className="product-image" alt={name} aria-label={name} src={displayImage}/>
      }

      <section className="product-info">
        <p className="product-brand">{brand}</p>
        <p className="product-name">{name}</p>
        <p id={getScoreClass(score)} className="product-score">score: {score}</p>
          <p>skin type(s): {skin_type.join(', ')}</p>

          {concerns.map(concern => {
              return(<p key={concern} className="concern-box">{concern}</p>)
              })
          }
      </section>
      <section className="like-and-save">
          <button className="button-wrapper" onClick={toggleLike}>
            {likedProducts.find(p => p.id === id)
            ? <img className="button-image" src={closedHeart}></img>
            : <img className="button-image" src={openHeart}></img>}
          </button>
          <button className="button-wrapper" onClick={toggleSave}>
            {savedProducts.find(p => p.id === id)
            ? <img className="button-image" src={closedBookmark}></img>
            : <img className="button-image" src={openBookmark}></img>}
          </button>
          <button className="button-wrapper" onClick={toggleDislike}>
            {dislikedProducts.find(p => p.id === id)
            ? <img className="button-image" src={closedDislike}></img>
            : <img className="button-image" src={openDislike}></img>}
          </button>
      </section>
    </div>
  );
}

export default Product;
