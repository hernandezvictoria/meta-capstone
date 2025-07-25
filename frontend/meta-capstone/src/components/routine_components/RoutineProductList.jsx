import { useState } from "react";
import Product from "../home_components/Product.jsx";
import "../../styles/ProductList.css";
import ProductModal from "../home_components/ProductModal.jsx";

function RoutineProductList({
    isSuggestedProducts,
    displayData,
    likedProducts,
    setLikedProducts,
    savedProducts,
    setSavedProducts,
    dislikedProducts,
    setDislikedProducts,
    routineProducts,
    setRoutineProducts,
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

    if (displayData.length === 0) {
        return isSuggestedProducts ? (
            <p>
                no suggested products to display, consider removing products
                from your routine
            </p>
        ) : (
            <p>your skincare routine will show up here</p>
        );
    }

    return (
        <>
            {modalProductId && getProductModal(displayData)}
            <div className="product-container">
                {displayData.map((prod) => {
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
                            skincareRoutineScore={
                                isSuggestedProducts
                                    ? prod.skincareRoutineScore
                                    : null
                            }
                        />
                    );
                })}
            </div>
        </>
    );
}

export default RoutineProductList;
