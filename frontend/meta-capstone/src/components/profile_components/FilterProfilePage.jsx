import ProfileProductList from "./ProfileProductList.jsx";
import UserInfo from "./UserInfo.jsx"
import {ProfileFilters} from '../../enums.js'
import { useEffect, useState } from "react";

const FilterProfilePage = () => {
    const [error, setError] = useState(null);
    const [username, setUsername] = useState("");
    const [concerns, setConcerns] = useState([]);
    const [skinType, setSkinType] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState(ProfileFilters.LIKED);
    const [likedProducts, setLikedProducts] = useState([]);
    const [savedProducts, setSavedProducts] = useState([]);
    const [dislikedProducts, setDislikedProducts] = useState([]);

    const loadUserInfo = async () => {
        fetch(`http://localhost:3000/user-info`, { credentials: "include" })
            .then((response) => response.json())
            .then((res) => {
                setUsername(res.username);
                setConcerns(res.concerns);
                setSkinType(res.skin_type);
            })
            .catch((error) => {
                setError("unable to fetch user info");
            });
    }

    useEffect(() => {
        loadUserInfo();
    }, []);

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
    }, [])

    const onFilterClick = (event) => {
        setError(null);
        setSelectedFilter(event.target.id);
    }

    return(
        <>
        <section className="profile-nav">
            <button aria-label="show liked products" id={ProfileFilters.LIKED} className="filter-button" onClick={onFilterClick}>loved</button>
            <button aria-label="show saved products" id={ProfileFilters.SAVED} className="filter-button" onClick={onFilterClick}>saved</button>
            <button aria-label="show disliked products" id={ProfileFilters.DISLIKED} className="filter-button" onClick={onFilterClick}>disliked</button>
            <button aria-label="show user info" id={ProfileFilters.USERINFO} className="filter-button" onClick={onFilterClick}>view profile</button>
        </section>
        {error ? (
            <p>{error}</p>
        ) : selectedFilter === ProfileFilters.USERINFO ? (
            <UserInfo username={username} concerns={concerns} skinType={skinType}/>
        ) : (
            <ProfileProductList
                filter={selectedFilter}
                setError={setError}
                likedProducts={likedProducts}
                setLikedProducts={setLikedProducts}
                savedProducts={savedProducts}
                setSavedProducts={setSavedProducts}
                dislikedProducts={dislikedProducts}
                setDislikedProducts={setDislikedProducts}/>
        )}
        </>
    )
}

export default FilterProfilePage;
