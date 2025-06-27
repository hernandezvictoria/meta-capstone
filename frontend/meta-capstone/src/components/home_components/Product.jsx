import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Product.css";

function Product({ brand, name }) {

  return (
    <div className="product">
      <img className="product-image" alt={name} aria-label={name} src="https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg"/>
      <section className="product-info">
        <p className="product-name">{name}</p>
        <p className="product-brand">{brand}</p>
      </section>
    </div>
  );
}

export default Product;
