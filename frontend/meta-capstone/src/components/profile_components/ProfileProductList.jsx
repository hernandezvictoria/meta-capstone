import React from "react";
import { useState, useEffect } from 'react'
import Product from "../home_components/Product.jsx";
import "../../styles/ProductList.css";
import ProductModal from "../home_components/ProductModal.jsx";
import {ProfileFilters} from '../../enums.js'


function ProfileProductList({filter, setError}) {

    const [modalProductId, setModalProductId] = useState(null);
    const [likedProducts, setLikedProducts] = useState([]);
    const [savedProducts, setSavedProducts] = useState([]);
    const [dislikedProducts, setDislikedProducts] = useState([]);

    const fetchLikedSavedDisliked = async () => {
        fetch(`http://localhost:3000/user-liked-saved-disliked`,
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
    }, [filter])

    const getDataToDisplay = () => {
        if (filter === ProfileFilters.LIKED){
            // if(likedProducts.length === 0){
            //     setError("your loved products will show up here")
            // }
            return likedProducts;
        }
        else if (filter === ProfileFilters.SAVED){
            // if(savedProducts.length === 0){
            //     setError("your saved products will show up here")
            // }
            return savedProducts;
        }
        else{
            // if(dislikedProducts.length === 0){
            //     setError("your disliked products will show up here")
            // }
            return dislikedProducts;
        }
    }

    // else{
        return (
            <>
                {modalProductId &&
                <ProductModal
                data={getDataToDisplay()}
                modalProductId={modalProductId}
                setError={setError}
                setModalProductId={setModalProductId}/>
                }
                <div className="product-container">
                {
                getDataToDisplay().map(prod => {
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
                    image={prod.image}/>);
                })
                }
                </div>
            </>
        );
    // }

}

export default ProfileProductList;
