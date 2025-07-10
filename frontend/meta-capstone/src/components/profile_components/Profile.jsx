import { useNavigate } from "react-router-dom";
import { useUser } from '../../contexts/UserContext';
import '../../styles/Profile.css';
import WithAuth from '../WithAuth'
import NavBar from '../NavBar'
import FilterProfilePage from './FilterProfilePage.jsx'

const Profile = () => {
    const { user, setUser } = useUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include', // Include credentials
            });

            if (response.ok) {
                setUser(null); // Clear the user in context
                navigate('/login'); // Redirect to the login page
            } else {
                console.error('failed to log out');
            }
        } catch (error) {
            console.error('network error, please try again', error);
        }
    };

    return (
        <>
            <NavBar />
            <div className="main-content">
                <h1>skinterest</h1>
                <p>this is the profile page</p>
                <button type="button" onClick={handleLogout}>log out</button>
                <FilterProfilePage/>
            </div>
        </>
    )
};

export default WithAuth(Profile);
