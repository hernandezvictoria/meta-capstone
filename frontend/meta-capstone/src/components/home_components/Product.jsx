import React from "react";
import {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import "../../styles/Product.css";

function Product({ setError, id, image, brand, name, product_type, price, ingredients, concerns, skin_type}) {

  const [displayImage, setDisplayImage] = useState(image);
  const [modalOpen, setModalOpen] = useState(false);

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
      } catch (error) {
        setDisplayImage("https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg");
      }
      updateImageInDb();
    }
  }

  const updateImageInDb = async() => {
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

  useEffect(() => {
    loadImage();
      }, [])

  const openModal = () => {
    setModalOpen(true);
  }

  //TODO: fix modal bug, modal not closing
  const closeModal = () => {
    console.log("closing modal"); // leaving in these console logs for future debugging
    setModalOpen(false);
    console.log(modalOpen);
  }

  useEffect(() => {
    console.log("Modal open state changed:", modalOpen);
  }, [modalOpen]);

  const modal = (
    <div className="modal-overlay" onClick={(event) => closeModal(event)}>
        <div className="modal" onClick={(event) => event.stopPropagation()}>
        <img className="product-image" alt={name} aria-label={name} src={displayImage}/>
        <section className="product-info">
          <p className="product-name">{name}</p>
          <p className="product-brand">{brand}</p>
          <p className="product-type">{product_type}</p>
          <p className="product-price">{price}</p>
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
          <p className="product-ingredients">highlighted ingredients: {ingredients.join(", ")}</p>
        </section>
        </div>
    </div>);

  return (
    <div className="product" onClick={openModal}>
      {modalOpen && modal}

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
