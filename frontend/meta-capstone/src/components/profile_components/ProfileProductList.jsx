import React from "react";
import { useState, useEffect } from 'react'
import Product from "../home_components/Product.jsx";
import "../../styles/ProductList.css";
import Modal from "../home_components/Modal.jsx";

function ProfileProductList({setError, data, isLovedShowing, lovedProducts, savedProducts}) {

    const [modalProductId, setModalProductId] = useState(null);

    if(data.length === 0){
        return(<p>your {isLovedShowing ? 'loved' : 'saved'} products will show up here</p>);
    }

    else{
        return (
            <>
                {modalProductId &&
                <Modal
                data={data}
                modalProductId={modalProductId}
                setError={setError}
                setModalProductId={setModalProductId}/>
                }
                <div className="product-container">
                {
                data.map(prod => {
                    return(<Product
                    isLikedInit={(lovedProducts.find(p => p.id === prod.id)) ? true : false}
                    isSavedInit={(savedProducts.find(p => p.id === prod.id)) ? true : false}
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
    }

}

export default ProfileProductList;
