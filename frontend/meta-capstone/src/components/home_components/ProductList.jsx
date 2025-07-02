import React from "react";
import { useState, useEffect } from 'react'
import Product from "./Product.jsx";
import "../../styles/ProductList.css";
import ProductModal from "./ProductModal.jsx";

function ProductList({error, setError,pageNum, setPageNum, maxPages, setMaxPages, searchTerm}) {

  // TODO: CUSTOM LOADING STATE
  const [modalProductId, setModalProductId] = useState(null);
  const [data, setData] = useState([]);
  const limit = 10;

  const fetchAllData = async () => {
      fetch(`http://localhost:3000/products?page=${pageNum}&limit=${limit}&searchTerm=${searchTerm}`,
        {credentials: "include"})
      .then((response) => response.json())
      .then((res) => {
        if(res.products.length === 0){ //if no more products to display
          setMaxPages(true);
        }
        if(pageNum === 1){
            if(res.products.length === 0){
              if(searchTerm === ""){
                setError("unable to load products")
              }
              else{
                setError("no products match your search")
              }
              return;
            }
            else{
              setData(res.products)
              if(res.products.length < limit){
                  setMaxPages(true);
                  return;
              }
            }
        }
        else{
          setData([...data, ...res.products])
          if(res.products.length < limit){
            setMaxPages(true);
          }
        }
      })
      .catch((error) => {
        setError("unable to fetch products");
      });
  }

  useEffect(() => {
    fetchAllData();
  }, [searchTerm, pageNum])

  const handleLoadMore = () => {
    setPageNum(pageNum + 1);
  }

  if(error){
    return(<p>{error}</p>);
  }

    else{
      return (
        <>
          {modalProductId &&
          <ProductModal
            data={data}
            modalProductId={modalProductId}
            setError={setError}
            setModalProductId={setModalProductId}/>
          }
          <div className="product-container">
          {
            data.map(prod => {
              return(<Product
                setModalProductId={setModalProductId}
                setError={setError}
                key={prod.id}
                id={prod.id}
                brand={prod.brand}
                name={prod.name}
                concerns={prod.concerns}
                skin_type={prod.skin_type}
                image={prod.image}/>);
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
