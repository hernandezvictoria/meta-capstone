import React from "react";
import { useState, useEffect } from 'react'
import Product from "./Product.jsx";
import "../../styles/ProductList.css";
// import {parseDataForCard} from "../utils/helper-functions.js";

function ProductList({error, setError, isSearching, data, setData, pageNum, setPageNum, maxPages, setMaxPages}) {

  // TODO: CUSTOM LOADING STATE

  const limit = 10;

  const fetchAllData = async () => {
      fetch(`http://localhost:3000/products?page=${pageNum}&limit=${limit}`, { credentials: "include" })
      .then((response) => response.json())
      .then((res) => {
        if(res.products.length === 0){ //if no more products to display
          setMaxPages(true);
        }
        if(pageNum === 1){
            if(res.products.length === 0){
                setError("no products to load")
            } else{
                setData(res.products)
                if(res.products.length < limit){
                    setMaxPages(true);
                }
            }
        }
        else{
            setData([...data, ...res.products])
        }
      })
      .catch(() => {
        setError("unable to fetch products");
      });
  }

  useEffect(() => {
    if(!isSearching){
      fetchAllData();
    }
  }, [isSearching, pageNum])

  useEffect(() => {
    if (data.length === 0) {
      setError("no products found");
    } else {
      setError(null); // Clear error if data is found
    }
  }, [data]);

  const handleLoadMore = () => {
    console.log("handling load more");
    setPageNum(pageNum + 1);
  }

  if(error){
    return(<p>{error}</p>);
  }

    else{
      return (
        <>
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
          { !maxPages &&
            <div className="load-more">
              <button onClick={handleLoadMore} className="load-more-button">Load More</button>
            </div>
          }
        </>

      );
    }
  }


export default ProductList;
