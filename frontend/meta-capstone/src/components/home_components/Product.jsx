import React from "react";
import {useState, useEffect} from 'react';
import "../../styles/Product.css";

function Product({ setModalProductId, setError, id, image, brand, name, concerns, skin_type}) {

  const [displayImage, setDisplayImage] = useState(image);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const loadLikedAndSaved = async () =>{
    fetch(`http://localhost:3000/get-liked-and-saved-status/${id}`,
      {credentials: "include"})
    .then((response) => response.json())
    .then((res) => {
      setIsLiked(res.isLiked);
      setIsSaved(res.isSaved);
    })
    .catch((error) => {
      setError("unable to fetch product info");
    });
  }

  useEffect(() =>{
    loadLikedAndSaved();
  }, []);


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
    try {
      const response = await fetch(`http://localhost:3000/toggle-like/${id}`, {
          method: "PUT",
          credentials: "include",
      });

      if (!response.ok) {
          setError("unable to like or unlike product");
      }
    } catch (error) {
        setError("network error, please try again");
    }
    setIsLiked(!isLiked);
  }

  const toggleSave = async(event) => {
    event.stopPropagation();
    try {
      const response = await fetch(`http://localhost:3000/toggle-save/${id}`, {
          method: "PUT",
          credentials: "include",
      });

      if (!response.ok) {
          setError("unable to save or unsave product");
      }
    } catch (error) {
        setError("network error, please try again");
    }
    setIsSaved(!isSaved);
  }

  return (
    <>
    <div className="product" onClick={openModal}>

      <img className="product-image" alt={name} aria-label={name} src={displayImage}/>
      <section className="product-info">
        <p className="product-name">{name}</p>
        <p className="product-brand">{brand}</p>
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
          <button onClick={toggleLike}>{isLiked ? 'unlike' : 'like'}</button>
          <button onClick={toggleSave}>{isSaved ? 'unsave' : 'save'}</button>
      </section>
    </div>
    </>
  );
}

export default Product;
