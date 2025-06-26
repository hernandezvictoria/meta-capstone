import React from "react";
import {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import "../../styles/Product.css";

function Product({ setError, id, image, brand, name, product_type, price, ingredients, concerns, skin_type}) {

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
        const fetchedImage = products_list[0].heroImage;
        setDisplayImage(fetchedImage);
      } catch (error) {
        setDisplayImage("https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg");
      }
    }
  }

  useEffect(() => {
    loadImage();
      }, [])

  const updateImageInDb = async() => {
    console.log("updating image in db");
    console.log(`http://localhost:3000/change-product-image/${id}`);
    try {
      const response = await fetch(`http://localhost:3000/change-product-image/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({image: displayImage}),
          credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
          setError("unable to process image in database");
      }
    } catch (error) {
        setError("network error, please try again");
    }
  }

  useEffect(() =>{
    if (displayImage !== image) { // Only update if the image has changed
      updateImageInDb();
    }
  }, [displayImage])

  return (
    <div className="product">
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
    </div>
  );
}

export default Product;
