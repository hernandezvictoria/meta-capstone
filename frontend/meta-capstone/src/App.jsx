import { useState } from 'react'
import './App.css'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import Home from './components/Home'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WithAuth from './components/WithAuth';

function App() {

  const ProtectedHome = WithAuth(Home);

  return (
    <Router>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/home" element={<ProtectedHome />}/>
        </Routes>
    </Router>

  )
}

export default App
