import React, { useRef } from "react";
import "../../styles/Search.css";


function Search({setError, setIsSearching, setData, setMaxPages, pageNum, data, setPageNum}) {
    const inputRef = useRef(null);
    const limit = 10;

    const handleSearch = (event) => {
        console.log("searching");
        event.preventDefault();
        setIsSearching(true);
        const query = inputRef.current.value;
        console.log(query);
        console.log(`http://localhost:3000/search/${query}?page=${pageNum}&limit=${limit}`)
        fetch(`http://localhost:3000/search/${query}?page=${pageNum}&limit=${limit}`)
        .then((response) => {return response.json()})
        .then((res) => {
            if(res.products.length === 0){ //if no more products to display
                setMaxPages(true);
            }
            console.log(res.products)
            if(pageNum === 1){
                if(res.products.length === 0){
                    setError("no products match your search")
                } else{
                    setData(res.products)
                    if(res.products.length < limit){
                        setMaxPages(true);
                    }
                }
            }
            else{
                setData([...data, ...res.products])
            }
        })
        .catch(error => setError("error searching for products"));
    };

    const handleClear = (event) => {
        event.preventDefault();
        inputRef.current.value = ""; // clear the input field too
        setIsSearching(false);
        setPageNum(1);
        setMaxPages(false);
    };

    return (
        <form className="search-form" onSubmit={handleSearch} onReset={handleClear}>
        <input
            className="search-input"
            type="text"
            placeholder="search boards"
            ref={inputRef}
        />
        <button aria-label="submit search" type="submit" className="search-button">
            search
        </button>
        <button aria-label="clear search" type="reset" className="clear-button">
            clear
        </button>
        </form>
    );
}

export default Search;
