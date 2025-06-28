import React from "react";
import { useState, useEffect } from 'react'
import Product from "./Product.jsx";
import "../../styles/ProductList.css";
// import {parseDataForCard} from "../utils/helper-functions.js";

function ProductContainer({data, setData}) {

  const [error, setError] = useState(null);

  // TODO: LOADING STATE

  const fetchAllData = async () => {
      fetch("http://localhost:3000/products", { credentials: "include" })
      .then((response) => response.json())
      .then((res) => { setData(res)})
      .catch(() => {
        setError("unable to fetch products");
      });
  }

  useEffect(() => {
      fetchAllData();
  }, [])

  useEffect(() => {
    if (data.length === 0) {
      setError("no products found");
    } else {
      setError(null); // Clear error if data is found
    }
  }, [data]);

    if(error){
      return(<p>{error}</p>);
    }

    else{
      return (
        <div className="product-container">
        {
          data.map(obj => {
            return(<Product
              setError={setError}
              key={obj.id}
              id={obj.id}
              brand={obj.brand}
              name={obj.name}
              product_type={obj.product_type}
              price={obj.price}
              ingredients={obj.ingredients}
              concerns={obj.concerns}
              skin_type={obj.skin_type}
              image={obj.image}/>);
          })
        }
        </div>
      );
    }
  }


export default ProductContainer;
