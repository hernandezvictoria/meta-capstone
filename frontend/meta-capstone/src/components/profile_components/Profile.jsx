import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import "../../styles/Profile.css";
import WithAuth from "../WithAuth";
import NavBar from "../NavBar";
import FilterProfilePage from "./FilterProfilePage.jsx";
import CacheStats from "../CacheStats";

function Profile() {
    const { user, setUser } = useUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/logout`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (response.ok) {
                setUser(null); // Clear the user in context
                navigate("/login");
            } else {
                console.error("failed to log out");
            }
        } catch (error) {
            console.error("network error, please try again", error);
        }
    };

    return (
        <>
            <NavBar />
            <CacheStats />
            <div className="main-content">
                <button className="logout-button" type="button" onClick={handleLogout}>
                    log out
                </button>
                <p className="greeting">hello, {user.username}</p>
                <h1>skinterest</h1>
                <FilterProfilePage />
            </div>
        </>
    );
}

export default WithAuth(Profile);
