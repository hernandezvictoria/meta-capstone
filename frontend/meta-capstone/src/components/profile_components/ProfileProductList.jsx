import React from "react";
import { useState, useEffect } from 'react'
import Product from "../home_components/Product.jsx";
import "../../styles/ProductList.css";
import ProductModal from "../home_components/ProductModal.jsx";

function ProfileProductList({setError, data, isLovedShowing}) {

    const [modalProductId, setModalProductId] = useState(null);

    if(data.length === 0){
        return(<p>your {isLovedShowing ? 'loved' : 'saved'} products will show up here</p>);
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
            </>
        );
    }

}

export default ProfileProductList;
