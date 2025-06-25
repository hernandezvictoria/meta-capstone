import { useState, useEffect } from "react";
import { useUser } from '../contexts/UserContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import WithAuth from './WithAuth'
import ProductContainer from './home_components/ProductContainer'

const Home = () => {
    const { user, setUser } = useUser();
    const navigate = useNavigate();
    const [data, setData] = useState([]);

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
            <p>This is the Home Page</p>
            <p>Hello {user.username}</p>
            <ProductContainer data={data} setData={setData}/>
            <button type="button" onClick={handleLogout}>log out</button>
        </>

    );
};

export default WithAuth(Home);
