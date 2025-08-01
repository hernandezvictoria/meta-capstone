import { useState } from "react";
import Product from "../home_components/Product.jsx";
import "../../styles/ProductList.css";
import ProductModal from "../home_components/ProductModal.jsx";
import { ProfileFilters } from "../../../../../common-enums.js";

function ProfileProductList({
    likedProducts,
    setLikedProducts,
    savedProducts,
    setSavedProducts,
    dislikedProducts,
    setDislikedProducts,
    routineProducts,
    setRoutineProducts,
    filter,
    setError,
}) {
    const [modalProductId, setModalProductId] = useState(null);

    const getProductModal = (data) => {
        return (
            <ProductModal
                data={data}
                modalProductId={modalProductId}
                setError={setError}
                setModalProductId={setModalProductId}
            />
        );
    };

    // return liked, saved, or disliked products based on filter
    if (filter === ProfileFilters.LIKED) {
        if (likedProducts.length === 0) {
            return <p>your loved products will show up here</p>;
        }
        return (
            <>
                {modalProductId && getProductModal(likedProducts)}
                <div className="product-container">
                    {likedProducts.map((prod) => {
                        return (
                            <Product
                                likedProducts={likedProducts}
                                setLikedProducts={setLikedProducts}
                                savedProducts={savedProducts}
                                setSavedProducts={setSavedProducts}
                                dislikedProducts={dislikedProducts}
                                setDislikedProducts={setDislikedProducts}
                                routineProducts={routineProducts}
                                setRoutineProducts={setRoutineProducts}
                                setModalProductId={setModalProductId}
                                setError={setError}
                                key={prod.id}
                                id={prod.id}
                                brand={prod.brand}
                                name={prod.name}
                                concerns={prod.concerns}
                                skin_type={prod.skin_type}
                                image={prod.image}
                                score={prod.score}
                            />
                        );
                    })}
                </div>
            </>
        );
    } else if (filter === ProfileFilters.SAVED) {
        if (savedProducts.length === 0) {
            return <p>your saved products will show up here</p>;
        }
        return (
            <>
                {modalProductId && getProductModal(savedProducts)}
                <div className="product-container">
                    {savedProducts.map((prod) => {
                        return (
                            <Product
                                likedProducts={likedProducts}
                                setLikedProducts={setLikedProducts}
                                savedProducts={savedProducts}
                                setSavedProducts={setSavedProducts}
                                dislikedProducts={dislikedProducts}
                                setDislikedProducts={setDislikedProducts}
                                routineProducts={routineProducts}
                                setRoutineProducts={setRoutineProducts}
                                setModalProductId={setModalProductId}
                                setError={setError}
                                key={prod.id}
                                id={prod.id}
                                brand={prod.brand}
                                name={prod.name}
                                concerns={prod.concerns}
                                skin_type={prod.skin_type}
                                image={prod.image}
                                score={prod.score}
                            />
                        );
                    })}
                </div>
            </>
        );
    } else {
        if (dislikedProducts.length === 0) {
            return <p>your disliked products will show up here</p>;
        }
        return (
            <>
                {modalProductId && getProductModal(dislikedProducts)}
                <div className="product-container">
                    {dislikedProducts.map((prod) => {
                        return (
                            <Product
                                likedProducts={likedProducts}
                                setLikedProducts={setLikedProducts}
                                savedProducts={savedProducts}
                                setSavedProducts={setSavedProducts}
                                dislikedProducts={dislikedProducts}
                                setDislikedProducts={setDislikedProducts}
                                routineProducts={routineProducts}
                                setRoutineProducts={setRoutineProducts}
                                setModalProductId={setModalProductId}
                                setError={setError}
                                key={prod.id}
                                id={prod.id}
                                brand={prod.brand}
                                name={prod.name}
                                concerns={prod.concerns}
                                skin_type={prod.skin_type}
                                image={prod.image}
                                score={prod.score}
                            />
                        );
                    })}
                </div>
            </>
        );
    }
}

export default ProfileProductList;
