import React from "react";
import {useState, useEffect} from 'react';
import "../../styles/Modal.css";

function Modal ({data, modalProductId, setError, setModalProductId}){

    const product_array = data.filter(prod => prod.id === modalProductId);
    if(product_array.length === 0){
        setError("unable to fetch product data, please reload the page")
    }

    const closeModal = () => {
        setModalProductId(null);
    }

    const product = product_array[0];
    return (
    <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(event) => event.stopPropagation()}>
        <img className="product-image" alt={product.name} aria-label={product.name} src={product.image}/>
        <section className="product-info">
          <p className="product-name">{product.name}</p>
          <p className="product-brand">{product.brand}</p>
          <p className="product-type">{product.product_type}</p>
          <p className="product-price">{product.price}</p>
          <section className="skin_type">
            {product.skin_type.map(type => {
              return(<p key={type} className="type_box">{type}</p>)
              })
            }
          </section>

          <section className="concerns">
            {product.concerns.map(concern => {
                return(<p key={concern} className="concern_box">{concern}</p>)
                })
            }
          </section>
          <p className="product-ingredients">highlighted ingredients: {product.ingredients.join(", ")}</p>
        </section>
        </div>
    </div>);
}

export default Modal;
