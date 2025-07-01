import { useState, useEffect } from "react";
import { useUser } from '../../contexts/UserContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../../styles/Home.css';
import WithAuth from '../WithAuth'
import ProductList from './ProductList'
import Search from './Search'
import NavBar from '../NavBar';

const Home = () => {
    const { user, setUser } = useUser();
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [maxPages, setMaxPages] = useState(false); //boolean indicating whether or not there are more pages to load
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <>
            <NavBar/>
            <div className="main-content">
                <h1>skinterest</h1>
                <p>This is the Home Page</p>
                <p>hello, {user.username}</p>
                <Search
                    setError={setError}
                    setMaxPages={setMaxPages}
                    setPageNum={setPageNum}
                    setSearchTerm={setSearchTerm}/>
                <ProductList
                    error={error}
                    setError={setError}
                    data={data}
                    setData={setData}
                    pageNum={pageNum}
                    setPageNum={setPageNum}
                    maxPages={maxPages}
                    setMaxPages={setMaxPages}
                    searchTerm={searchTerm}/>
            </div>
        </>
    );
};

export default WithAuth(Home);
