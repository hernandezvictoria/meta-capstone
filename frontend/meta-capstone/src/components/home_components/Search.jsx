import { useRef } from "react";
import "../../styles/Search.css";
import clearIcon from "../../assets/clear.png";

function Search({ setError, setMaxPages, setPageNum, setSearchTerm }) {
    const inputRef = useRef(null);

    const handleSearch = (event) => {
        event.preventDefault();
        setPageNum(1);
        setMaxPages(false);
        setError(null);
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
        <form
            className="search-form"
            onSubmit={handleSearch}
            onReset={handleClear}
        >
            <input
                className="search-input"
                type="text"
                placeholder="search products"
                ref={inputRef}
            />
            <button
                aria-label="clear search"
                type="reset"
                className="clear-button"
            >
                <img className="button-image" src={clearIcon}></img>
            </button>
        </form>
    );
}

export default Search;
