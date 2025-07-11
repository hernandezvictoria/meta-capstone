import React from "react";
import { useState, useEffect } from 'react'
import Product from "./Product.jsx";
import "../../styles/ProductList.css";
import ProductModal from "./ProductModal.jsx";
import Loading from './Loading';

function ProductList({error, setError,pageNum, setPageNum, maxPages, setMaxPages, searchTerm}) {

  // TODO: CUSTOM LOADING STATE
  const [modalProductId, setModalProductId] = useState(null);
  const [data, setData] = useState([]);
  const limit = 10; // can change limit later
  const [likedProducts, setLikedProducts] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [dislikedProducts, setDislikedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  const fetchAllData = async () => {
      setIsLoading(true);
      fetch(`${import.meta.env.VITE_BASE_URL}/products?page=${pageNum}&limit=${limit}&searchTerm=${searchTerm}`,
        {credentials: "include"})
      .then((response) => response.json())
      .then((res) => {
        if(res.products.length === 0){ //if no more products to display
          setMaxPages(true);
        }
        if(pageNum === 1){
            if(res.products.length === 0){
              if(searchTerm === ""){
                setError("no products to display")
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
      })
      .finally(() => {
        setTimeout(() => setIsLoading(false), 500); // 500ms so that it is on the screen for a long enough time
      })
  }

  useEffect(() => {
    fetchAllData();
  }, [searchTerm, pageNum])

  const fetchLikedSavedDisliked = async () => {
    fetch(`${import.meta.env.VITE_BASE_URL}/user-liked-saved-disliked`,
      {credentials: "include"})
    .then((response) => response.json())
    .then((res) => {
      setLikedProducts(res.loved_products);
      setSavedProducts(res.saved_products);
      setDislikedProducts(res.disliked_products);
    })
    .catch((error) => {
      setError("unable to fetch products");
    });
  }

  useEffect(() => {
    fetchLikedSavedDisliked();
  }, [])

  const handleLoadMore = () => {
    setPageNum(pageNum + 1);
  }

  if(error){
    return(<p>{error}</p>);
  }

  else if(isLoading){
    return(<Loading/>);
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
              likedProducts={likedProducts}
              setLikedProducts={setLikedProducts}
              savedProducts={savedProducts}
              setSavedProducts={setSavedProducts}
              dislikedProducts={dislikedProducts}
              setDislikedProducts={setDislikedProducts}
              setModalProductId={setModalProductId}
              setError={setError}
              key={prod.id}
              id={prod.id}
              brand={prod.brand}
              name={prod.name}
              concerns={prod.concerns}
              skin_type={prod.skin_type}
              image={prod.image}
              score={prod.score}/>);
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
