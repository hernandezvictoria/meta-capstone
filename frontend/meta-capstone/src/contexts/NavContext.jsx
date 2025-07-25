import { createContext, useState, useContext } from "react";
import { Pages } from "../../../../common-enums.js";

const NavContext = createContext();

export const NavProvider = ({ children }) => {
    const [currentPage, setCurrentPage] = useState(Pages.HOME);

    return (
        <NavContext.Provider value={{ currentPage, setCurrentPage }}>
            {children}
        </NavContext.Provider>
    );
};

export const useNav = () => useContext(NavContext);
