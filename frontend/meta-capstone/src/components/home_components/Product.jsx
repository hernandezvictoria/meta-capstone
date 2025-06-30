import React from "react";
import {useState, useEffect} from 'react';
import "../../styles/Product.css";

function Product({ setModalProductId, setError, id, image, brand, name, concerns, skin_type}) {

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
        //TODO: FIX THIS, PASS IN IMAGE TO UPDATEIMAGEINDB
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
    </div>
    </>
  );
}

export default Product;
