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

    const onLovedClick = () => {
        setIsLovedShowing(true);
        setIsProfileShowing(false);
        setError(null);
    }

    const onSavedClick = () => {
        setIsLovedShowing(false);
        setIsProfileShowing(false);
        setError(null);
    }

    const onViewProfileClick = () => {
        setIsProfileShowing(true);
        setError(null);
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
                    <button aria-label="show loved products" id="loved-products" className="filter-button" onClick={onLovedClick}>loved</button>
                    <button aria-label="show saved products" id="saved-products" className="filter-button" onClick={onSavedClick}>saved</button>
                    <button aria-label="show user info" id="user-info" className="filter-button" onClick={onViewProfileClick}>view profile</button>
                </section>
                {error ? (
                    <p>{error}</p>
                ) : isProfileShowing ? (
                    <UserInfo username={username} concerns={concerns} skinType={skinType}/>
                ) : (
                    <ProfileProductList
                        data={isLovedShowing ? lovedProducts : savedProducts}
                        isLovedShowing={isLovedShowing}
                        setError={setError}
                        lovedProducts={lovedProducts}
                        savedProducts={savedProducts}/>
                )}
            </div>
        </>
    )
};

export default WithAuth(Profile);
