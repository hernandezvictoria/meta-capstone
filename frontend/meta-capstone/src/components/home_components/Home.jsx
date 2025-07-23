import { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import "../../styles/Home.css";
import WithAuth from "../WithAuth";
import ProductList from "./ProductList";
import Search from "./Search";
import NavBar from "../NavBar";
import CacheStats from "../CacheStats";

function Home() {
    const { user, setUser } = useUser();
    const [error, setError] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [maxPages, setMaxPages] = useState(false); //boolean indicating whether or not there are more pages to load
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <>
            <NavBar />
            <CacheStats />
            <div className="main-content">
                <p className="greeting">hello, {user.username}</p>
                <h1>skinterest</h1>
                <Search
                    setError={setError}
                    setMaxPages={setMaxPages}
                    setPageNum={setPageNum}
                    setSearchTerm={setSearchTerm}
                />
                <div className="body">
                    <ProductList
                        error={error}
                        setError={setError}
                        pageNum={pageNum}
                        setPageNum={setPageNum}
                        maxPages={maxPages}
                        setMaxPages={setMaxPages}
                        searchTerm={searchTerm}
                    />
                </div>
            </div>
        </>
    );
}

export default WithAuth(Home);
