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
                <img
                    className="product-image"
                    alt={product.name}
                    aria-label={product.name}
                    src={product.image}
                />
                <section className="product-info">
                    <p className="product-brand">{product.brand}</p>
                    <p className="product-name">{product.name}</p>
                    <p className="product-type">{product.product_type}</p>
                    <p className="product-price">${product.price}</p>
                    <section className="skin_type">
                        {product.skin_type.map((type) => {
                            return (
                                <p key={type} className="type_box">
                                    {type}
                                </p>
                            );
                        })}
                    </section>

                    <section className="concerns">
                        {product.concerns.map((concern) => {
                            return (
                                <p key={concern} className="concern_box">
                                    {concern}
                                </p>
                            );
                        })}
                    </section>
                    {product.ingredients?.length > 0 && ( //if there are ingredients to display
                        <p className="highlighted-ingredients">
                            highlighted ingredients:
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
