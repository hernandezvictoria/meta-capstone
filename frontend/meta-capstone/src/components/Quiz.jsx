import {SkinTypes, SkinConcerns} from "../../../enums.js";

import { useState } from "react";
import { useUser } from '../contexts/UserContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../styles/Quiz.css';
import WithAuth from './WithAuth'

const Quiz = () => {
    const { user, setUser } = useUser();
    const navigate = useNavigate();

    return (
        <>

            <p>This is the Quiz Page</p>
            <p>Hello {user.username}</p>
            <button type="button" onClick={handleLogout}>log out</button>
        </>

    );
};

export default WithAuth(Quiz);
