import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import { Link, useParams } from 'react-router-dom';
import '../styles/Profile.css';
import WithAuth from './WithAuth'

const Profile = () => {
    return(
        <>
            <p>this is the profile page</p>
        </>
    )
};

export default WithAuth(Profile);
