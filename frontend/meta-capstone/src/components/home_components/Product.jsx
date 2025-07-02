import React from "react";
import {useState, useEffect} from 'react';
import "../../styles/Product.css";

function Product({likedProducts, setLikedProducts, savedProducts, setSavedProducts, dislikedProducts, setDislikedProducts, setModalProductId, setError, id, image, brand, name, concerns, skin_type}) {

  const [displayImage, setDisplayImage] = useState(image);

  const loadImage = async () => {
    // if image is not in DB
    if(!image){
      const url = `https://real-time-sephora-api.p.rapidapi.com/search-by-keyword?sortBy=BEST_SELLING&keyword=${name}&brandFilter=${brand}`;
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': import.meta.env.VITE_API_KEY,
          'x-rapidapi-host': 'real-time-sephora-api.p.rapidapi.com'
        }
      };

      try {
        const response = await fetch(url, options);
        const result = await response.json();
        const products_list = result.data.products;
        if(products_list.length === 0){
          throw new Error("no products in products list"); // throw error to be caught, sets display image to placeholder
        }
        const fetchedImage = products_list[0].heroImage;
        setDisplayImage(fetchedImage);
        updateImageInDb(fetchedImage);
      } catch (error) {
        setDisplayImage("https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg");
        updateImageInDb("https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg");
      }
    }
  }

  const updateImageInDb = async(image) => {
    try {
      const response = await fetch(`http://localhost:3000/change-product-image/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({image: image}),
          credentials: "include",
      });

      if (!response.ok) {
          setError("unable to process image in database");
      }
    } catch (error) {
        setError("network error, please try again");
    }
  }

  useEffect(() => {
    loadImage();
      }, [])

  const openModal = () => {
    setModalProductId(id);
  }

  const toggleLike = async(event) => {
    event.stopPropagation();

    fetch(`http://localhost:3000/toggle-like/${id}`,
      {method: "PUT",
      credentials: "include"})
    .then((response) => response.json())
    .then((res) => {
      const removedLike = res.removedLike;

      if(removedLike){
        setLikedProducts(likedProducts.filter(p => p.id !== id));
      }
      else{
        // Add the product to the array (only adding ID here bc don't have all necessary info to create product obj, will get updated when re-fetched)
        setLikedProducts([...likedProducts, { id: id }]);
      }
    })
    .catch((error) => setError("error while toggling like"));
  }

  const toggleSave = async(event) => {
    event.stopPropagation();
    fetch(`http://localhost:3000/toggle-save/${id}`,
      {method: "PUT",
      credentials: "include"})
    .then((response) => response.json())
    .then((res) => {
      const removedSave = res.removedSave;

      if(removedSave){
        setSavedProducts(savedProducts.filter(p => p.id !== id));
      }
      else{
        setSavedProducts([...savedProducts, { id: id }]);
      }
    })
    .catch((error) => setError("error while toggling save"));
  }

  const toggleDislike = async(event) => {
    event.stopPropagation();
    fetch(`http://localhost:3000/toggle-dislike/${id}`,
      {method: "PUT",
      credentials: "include"})
    .then((response) => response.json())
    .then((res) => {
      const removedDislike = res.removedDislike;

      if(removedDislike){
        setDislikedProducts(dislikedProducts.filter(p => p.id !== id));
      }
      else{
        setDislikedProducts([...dislikedProducts, { id: id }]);
      }
    })
    .catch((error) => setError("error while toggling dislike"));
  }

  return (
    <div className="product" onClick={openModal}>

      <img className="product-image" alt={name} aria-label={name} src={displayImage}/>
      <section className="product-info">
        <p className="product-brand">{brand}</p>
        <p className="product-name">{name}</p>
        <section className="skin_type">
          {skin_type.map(type => {
            return(<p key={type} className="type_box">{type}</p>)
            })
          }
        </section>

        <section className="concerns">
          {concerns.map(concern => {
              return(<p key={concern} className="concern_box">{concern}</p>)
              })
          }
        </section>
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
