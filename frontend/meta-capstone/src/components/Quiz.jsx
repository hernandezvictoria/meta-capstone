import { SkinTypes, SkinConcerns } from '../enums';


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
            <h2>tell us about your skinterests</h2>
            <p>This is the Quiz Page</p>
            <p>Hello {user.username}</p>
        </>

    );
};

export default WithAuth(Quiz);
