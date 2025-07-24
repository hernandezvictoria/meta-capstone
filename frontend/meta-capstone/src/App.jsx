import "./App.css";
import SignupForm from "./components/SignupForm";
import LoginForm from "./components/LoginForm";
import Home from "./components/home_components/Home";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WithAuth from "./components/WithAuth";
import Quiz from "./components/Quiz";
import Profile from "./components/profile_components/Profile";
import RoutinePage from "./components/routine_components/RoutinePage";
import { NavProvider } from "./contexts/NavContext";

function App() {
	const ProtectedHome = WithAuth(Home);
	const ProtectedQuiz = WithAuth(Quiz);
	const ProtectedProfile = WithAuth(Profile);
	const ProtectedRoutinePage = WithAuth(RoutinePage);

	return (
		<NavProvider>
		<Router>
			<Routes>
			<Route path="/" element={<LoginForm />} />
			<Route path="/signup" element={<SignupForm />} />
			<Route path="/login" element={<LoginForm />} />
			<Route path="/home" element={<ProtectedHome />} />
			<Route path="/quiz" element={<ProtectedQuiz />} />
			<Route path="/profile" element={<ProtectedProfile />} />
			<Route path="/routine" element={<ProtectedRoutinePage />} />
			</Routes>
		</Router>
		</NavProvider>
	);
}

export default App;
