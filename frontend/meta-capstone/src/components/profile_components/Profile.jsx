// Profile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../../contexts/UserContext';
import { Link, useParams } from 'react-router-dom';
import '../../styles/Profile.css';
import WithAuth from '../WithAuth'
import NavBar from '../NavBar'
import ProfileProductList from "./ProfileProductList";
import UserInfo from "./UserInfo"
import {ProfileFilters} from '../../enums.js'

const Profile = () => {
    const { user, setUser } = useUser();
    const navigate = useNavigate();
    const [isLovedShowing, setIsLovedShowing] = useState(true);
    const [isProfileShowing, setIsProfileShowing] = useState(false);
    const [error, setError] = useState(null);
    const [lovedProducts, setLovedProducts] = useState([]);
    const [savedProducts, setSavedProducts] = useState([]);
    const [username, setUsername] = useState("");
    const [concerns, setConcerns] = useState([]);
    const [skinType, setSkinType] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState(ProfileFilters.LIKED);

    const loadUserInfo = async () => {
        fetch(`http://localhost:3000/user-info`, { credentials: "include" })
            .then((response) => response.json())
            .then((res) => {
                setLovedProducts(res.loved_products);
                setSavedProducts(res.saved_products);
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

    // const onLovedClick = () => {
    //     setIsLovedShowing(true);
    //     setIsProfileShowing(false);
    //     setError(null);
    // }

    // const onSavedClick = () => {
    //     setIsLovedShowing(false);
    //     setIsProfileShowing(false);
    //     setError(null);
    // }

    // const onViewProfileClick = () => {
    //     setIsProfileShowing(true);
    //     setError(null);
    // }

    const onFilterClick = (event) => {
        setError(null);
        setSelectedFilter(event.target.id);
    }

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:3000/logout', {
                method: 'POST',
                credentials: 'include', // Include credentials
            });

            if (response.ok) {
                setUser(null); // Clear the user in context
                navigate('/login'); // Redirect to the login page
            } else {
                console.error('failed to log out');
            }
        } catch (error) {
            console.error('network error, please try again', error);
        }
    };

    return (
        <>
            <NavBar />
            <div className="main-content">
                <h1>skinterest</h1>
                <p>this is the profile page</p>
                <button type="button" onClick={handleLogout}>log out</button>
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
                        setError={setError}/>
                )}
            </div>
        </>
    )
};

export default WithAuth(Profile);
