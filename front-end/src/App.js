import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; 
import Welcome from "./components/Welcome"
import Login from "./components/Login";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Stats from "./components/Stats";

export default function App() {

  return (
    <Router>
      <div> 
        <Navbar /> 
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </div>
    </Router>
  );
}
