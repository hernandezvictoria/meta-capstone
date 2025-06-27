import React, { useRef } from "react";
import "../../styles/Search.css";


function Search({setError, setIsSearching, setData}) {

    const inputRef = useRef(null);

    const handleSearch = (event) => {
        event.preventDefault();
        setIsSearching(true);
        const query = inputRef.current.value;
        fetch(`http://localhost:3000/search/${query}`)
        .then((response) => {return response.json()})
        .then((data) => setData(data))
        .catch(error => setError("error searching for products"));
    };

    const handleClear = (event) => {
        event.preventDefault();
        inputRef.current.value = ""; // clear the input field too
        setIsSearching(false);
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
