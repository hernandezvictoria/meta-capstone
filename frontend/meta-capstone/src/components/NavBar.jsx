import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import { Link, useParams } from 'react-router-dom';
import '../styles/NavBar.css';

const NavBar = () => {
    return(
        // <img className="back-icon" src={backIcon} alt="back icon" aria-label="return to home"/>
        <div className="nav-bar">
            <Link to="/home" aria-label="home">🏠</Link>
            <Link to="/profile" aria-label="profile">👩</Link>
        </div>
    )
};

export default NavBar;
