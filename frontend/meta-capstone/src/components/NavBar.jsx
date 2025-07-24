import { Link } from "react-router-dom";
import "../styles/NavBar.css";
import openHome from "../assets/open-home.png";
import closedHome from "../assets/closed-home.png";
import openProfile from "../assets/open-profile.png";
import closedProfile from "../assets/closed-profile.png";
import openStar from "../assets/open-star.png";
import closedStar from "../assets/closed-star.png";
import logo from "../assets/logo.png";
import { useNav } from "../contexts/NavContext";
import { Pages } from "../enums.js";
import { useEffect } from "react";

function NavBar() {
    const { currentPage, setCurrentPage } = useNav();

    useEffect(() => {
        console.log("Current page: " + currentPage);
    }, [currentPage])

    return (
        <div className="nav-bar">

            <Link
                to="/home"
                aria-label="home"
                onClick={() => setCurrentPage(Pages.HOME)}
            >
                <img className="nav-icon" src={logo}></img>
            </Link>

            <Link
                to="/home"
                aria-label="home"
                onClick={() => setCurrentPage(Pages.HOME)}
            >
                <img
                    className="nav-icon"
                    src={(currentPage === Pages.HOME) ? closedHome : openHome}
                ></img>
            </Link>

            <Link
                to="/profile"
                aria-label="profile"
                onClick={() => {
                    setCurrentPage(Pages.PROFILE);
                }}
            >
                <img
                    className="nav-icon"
                    src={
                        (currentPage === Pages.PROFILE)
                            ? closedProfile
                            : openProfile
                    }
                ></img>
            </Link>
            
            <Link
                to="/routine"
                aria-label="routine"
                onClick={() => {
                    setCurrentPage(Pages.ROUTINE);
                }}
            >
                <img
                    className="nav-icon"
                    src={
                        (currentPage === Pages.ROUTINE)
                            ? closedStar
                            : openStar
                    }
                ></img>
            </Link>

        </div>
    );
}

export default NavBar;
