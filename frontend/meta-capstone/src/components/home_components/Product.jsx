import React from "react";
import {useState, useEffect} from 'react';
import "../../styles/Product.css";

function Product({likedProducts, setLikedProducts, savedProducts, setSavedProducts, dislikedProducts, setDislikedProducts, setModalProductId, setError, id, image, brand, name, concerns, skin_type, score}) {

  const [displayImage, setDisplayImage] = useState(image);
  const [isLoading, setIsLoading] = useState(false);
  const placeholderImage = "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg";

  const loadImage = async () => {
    // if image is not in DB
    setDisplayImage(placeholderImage);
    updateImageInDb(placeholderImage);
    // if(!image){
    //   setIsLoading(true);
    //   console.error("no image in DB"); // throw error to be caught, sets display image to placeholder
    //   const url = `https://real-time-sephora-api.p.rapidapi.com/search-by-keyword?sortBy=BEST_SELLING&keyword=${name}&brandFilter=${brand}`;
    //   const options = {
    //     method: 'GET',
    //     headers: {
    //       'x-rapidapi-key': import.meta.env.VITE_API_KEY,
    //       'x-rapidapi-host': 'real-time-sephora-api.p.rapidapi.com'
    //     }
    //   };

    //   fetch(url, options)
    //   .then((response) => response.json())
    //   .then((res) => {
    //     const products_list = res.data.products;
    //     if(products_list.length === 0){
    //       throw new Error("no products in products list"); // throw error to be caught, sets display image to placeholder
    //     }
    //     const fetchedImage = products_list[0].heroImage;
    //     setDisplayImage(fetchedImage);
    //     updateImageInDb(fetchedImage);
    //   })
    //   .catch((error) => {
    //     setDisplayImage(placeholderImage);
    //     updateImageInDb(placeholderImage);
    //   })
    //   .finally(() => {
    //     setTimeout(() => setIsLoading(false), 500);
    //   });
    // }
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

  const openModal = () => {
    setModalProductId(id);
  }

  const toggleLike = async(event) => {
    event.stopPropagation();

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
          <button onClick={toggleLike}>{likedProducts.some(p => p.id === id) ? '♥️' : '♡'}</button>
          <button onClick={toggleSave}>{savedProducts.some(p => p.id === id) ? 'unsave' : 'save'}</button>
          <button onClick={toggleDislike}>{dislikedProducts.some(p => p.id === id) ? 'un-dislike' : 'dislike'}</button>
      </section>
    </div>
  );
}

export default Product;
