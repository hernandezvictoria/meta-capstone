import { useState, useEffect } from "react";
import { useUser } from '../contexts/UserContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import WithAuth from './WithAuth'
import ProductList from './home_components/ProductList'
import Search from './home_components/Search'

const Home = () => {
    const { user, setUser } = useUser();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [maxPages, setMaxPages] = useState(false); //boolean indicating whether or not there are more pages to load

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
            <Search setError={setError} setIsSearching={setIsSearching} setData={setData} data={data} setMaxPages={setMaxPages} pageNum={pageNum} setPageNum={setPageNum}/>
            <ProductList error={error} setError={setError} isSearching={isSearching} data={data} setData={setData} pageNum={pageNum} setPageNum={setPageNum} maxPages={maxPages} setMaxPages={setMaxPages}/>
            <button type="button" onClick={handleLogout}>log out</button>
        </>

    );
};

export default WithAuth(Home);
