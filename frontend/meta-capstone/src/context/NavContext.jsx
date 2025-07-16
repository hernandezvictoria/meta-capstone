import { createContext, useState, useContext } from "react";

const NavContext = createContext();

export const NavProvider = ({ children }) => {
  const [isHome, setIsHome] = useState(true);

  return (
    <NavContext.Provider value={{ isHome, setIsHome }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);
