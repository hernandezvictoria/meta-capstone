import React from "react";
import { useState, useEffect } from 'react'
import Product from "./Product.jsx";
import "../../styles/ProductContainer.css";
// import {parseDataForCard} from "../utils/helper-functions.js";

function ProductContainer({data, setData}) {

    const fetchAllData = async () => {

      fetch("http://localhost:3000/products", { credentials: "include" })
        .then((response) => response.json())
        .then((res) => { setData(res)})
        .catch(() => {
          console.error("unable to fetch products: ", error);
        });
    }

    useEffect(() => {
        fetchAllData();
    }, [])



    if(data.length === 0) {
        return <div className="row">
        <p>no products found</p>
        </div>;
    }
    else{
        return (
            <div className="product-container">
            {
                data.map(obj => {
                    return(<Product
                            key={obj.id}
                            brand={obj.brand}
                            name={obj.name}/>);
                })
                }
            </div>
        );
    }


}

export default ProductContainer;
