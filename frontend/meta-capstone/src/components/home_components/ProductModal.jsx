import "../../styles/ProductModal.css";

function ProductModal({ data, modalProductId, setError, setModalProductId }) {
    const product = data.find((prod) => prod.id === modalProductId);

    if (!product) {
        setError("unable to fetch product data, please reload the page");
    }

    const closeModal = () => {
        setModalProductId(null);
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
                <section className="image-and-name">
                    <img
                        className="product-image"
                        alt={product.name}
                        aria-label={product.name}
                        src={product.image}
                    />
                    <p className="product-brand">{product.brand}</p>
                    <p className="product-name">{product.name}</p>
                </section>
                <section className="modal-product-info">
                    <p className="product-type">
                        <b>product type:</b> {product.product_type}
                    </p>
                    <p className="product-price"><b>price:</b> ${product.price}</p>
                    <p className="skin-types"><b>targeted skin type(s):</b> {product.skin_type.join(", ")}</p>
                    <p className="skin-concerns"><b>targeted concern(s):</b> {product.concerns.join(", ")}</p>
                    {product.ingredients?.length > 0 && ( //if there are ingredients to display
                        <p className="highlighted-ingredients">
                            <b>highlighted ingredients:</b>
                        </p>
                    )}
                    {product.ingredients?.map((ingredient) => {
                        return (
                            <div key={ingredient.name} className="ingredient">
                                <p className="ingredient-name">
                                    {ingredient.name}
                                </p>
                                <p
                                    data-text={ingredient.purpose}
                                    className="ingredient-tooltip"
                                >
                                    ⍰
                                </p>
                            </div>
                        );
                    })}

                </section>
            </div>
        </div>
    );
}

export default ProductModal;
