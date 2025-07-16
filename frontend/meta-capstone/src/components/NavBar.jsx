import { Link } from "react-router-dom";
import "../styles/NavBar.css";
import openHome from "../assets/open-home.png";
import closedHome from "../assets/closed-home.png";
import openProfile from "../assets/open-profile.png";
import closedProfile from "../assets/closed-profile.png";
import logo from "../assets/logo.png";
import { useNav } from "../context/NavContext";

const NavBar = () => {
  const { isHome, setIsHome } = useNav();
  return (
    <div className="nav-bar">
      <Link to="/home" aria-label="home" onClick={() => setIsHome(true)}>
        <img className="nav-icon" src={logo}></img>
      </Link>
      <Link to="/home" aria-label="home" onClick={() => setIsHome(true)}>
        <img className="nav-icon" src={isHome ? closedHome : openHome}></img>
      </Link>
      <Link
        to="/profile"
        aria-label="profile"
        onClick={() => {
          setIsHome(false);
          console.log("switched to profile, isHome:", false);
        }}
      >
        <img
          className="nav-icon"
          src={isHome ? openProfile : closedProfile}
        ></img>
      </Link>
    </div>
  );
};

export default NavBar;
