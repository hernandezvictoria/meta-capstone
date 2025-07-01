import React, { useState, useEffect } from "react";
import Product from "./Product.jsx";
import "../../styles/ProductList.css";
import Modal from "./Modal.jsx";

function ProductList({ error, setError, data, setData, pageNum, setPageNum, maxPages, setMaxPages, searchTerm }) {
  const [modalProductId, setModalProductId] = useState(null);
  const limit = 10; // hard coded for now... can be updated later
  const [likedProducts, setLikedProducts] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const productResponse = await fetch(`http://localhost:3000/products?page=${pageNum}&limit=${limit}&searchTerm=${searchTerm}`, { credentials: "include" });
      const productData = await productResponse.json();

      if (productData.products.length === 0) {
        setMaxPages(true);
      }
      if (pageNum === 1) {
        if (productData.products.length === 0) {
          setError(searchTerm === "" ? "unable to load products" : "no products match your search");
          return;
        } else {
          setData(productData.products);
          if (productData.products.length < limit) {
            setMaxPages(true);
            return;
          }
        }
      } else {
        setData([...data, ...productData.products]);
        if (productData.products.length < limit) {
          setMaxPages(true);
        }
      }

      const userResponse = await fetch('http://localhost:3000/user-liked-and-saved', { credentials: "include" });
      const userData = await userResponse.json();
      setLikedProducts(userData.loved_products);
      setSavedProducts(userData.saved_products);

      setLoading(false); // set loading to false once data is fetched
    } catch (error) {
      setError("unable to fetch products");
      setLoading(false); // ensure loading is false even on error
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [searchTerm, pageNum]);

  const handleLoadMore = () => {
    setPageNum(pageNum + 1);
  };

  if (loading) {
    return <p>Loading...</p>; // TODO: UPDATE LOADING STATE
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <>
      {modalProductId && (
        <Modal
          data={data}
          modalProductId={modalProductId}
          setError={setError}
          setModalProductId={setModalProductId}
        />
      )}
      <div className="product-container">
        {data.map(prod => (
          <Product
            isLikedInit={likedProducts.some(p => p.id === prod.id)}
            isSavedInit={savedProducts.some(p => p.id === prod.id)}
            setModalProductId={setModalProductId}
            setError={setError}
            key={prod.id}
            id={prod.id}
            brand={prod.brand}
            name={prod.name}
            concerns={prod.concerns}
            skin_type={prod.skin_type}
            image={prod.image}
          />
        ))}
      </div>
      {!maxPages && (
        <div className="load-more">
          <button onClick={handleLoadMore} className="load-more-button">Load More</button>
        </div>
      )}
    </>
  );
}

export default ProductList;
