import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

function WithAuth(WrappedComponent) {
    return function ProtectedComponent(props) {
        const { user, setUser } = useUser();
        const navigate = useNavigate();

        useEffect(() => {
            async function fetchData() {
                if (!user) {
                    try {
                        const response = await fetch(
                            `${import.meta.env.VITE_BASE_URL}/me`,
                            { credentials: "include" }
                        );
                        const data = await response.json();
                        // Ensure the response contains the user id
                        if (data.id) {
                            setUser(data);
                        } else {
                            navigate("/login");
                        }
                    } catch (error) {
                        navigate("/login");
                    }
                }
            }
            fetchData();
        }, [user, setUser, navigate]);

        if (!user) {
            return <p>loading...</p>; // prevents flickering
        }

        return <WrappedComponent {...props} />;
    };
}

export default WithAuth;
