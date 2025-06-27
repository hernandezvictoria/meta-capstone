import React, { useRef } from "react";
import "../../styles/Search.css";


function Search({setError, setMaxPages, setPageNum, setSearchTerm}) {
    const inputRef = useRef(null);
    const limit = 10;

    const handleSearch = (event) => {
        event.preventDefault();
        setSearchTerm(inputRef.current.value);
    };

    const handleClear = (event) => {
        event.preventDefault();
        inputRef.current.value = ""; // clear the input field too
        setSearchTerm("");
        setPageNum(1);
        setMaxPages(false);
        setError(null);
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
