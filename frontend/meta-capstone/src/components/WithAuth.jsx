import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
import { Loading } from './home_components/Loading';

function WithAuth (WrappedComponent) {
    return function ProtectedComponent(props) {
        const { user, setUser } = useUser();
        const navigate = useNavigate();

        useEffect(async () => {
            if (!user) {
                try{
                    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/me`, { credentials: "include" });
                    const data = await response.json();
                    if (data.id) { // Ensure the response contains the user id
                        setUser(data); // Set the user in context
                    } else {
                        navigate("/login");
                    }
                } catch(error){
                    navigate("/login");
                }
            }
        }, [user, setUser, navigate]);

        if (!user) {
            return <Loading/>; // prevents flickering
        }

        return <WrappedComponent {...props} />;
    };
};

export default WithAuth;
