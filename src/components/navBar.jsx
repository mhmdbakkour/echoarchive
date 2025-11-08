import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import '../styles/navBar.css';

function NavBar() {
  return (
    <nav className="navigation">
      <img src={logo} className="nav-logo"></img>
      <h2>Echo Archive</h2>
      <div className="vertical-divider"></div>
      <div className="nav-links">
        <Link to={"/"}>Dashboard</Link>
        <Link to={"/record"}>Record</Link>
        <Link to={"/archive"}>Archive</Link>
        <Link to={"/timeline"}>Timeline</Link>
        <Link to={"/profile"}>Profile</Link>
      </div>
    </nav>
  );
}

export default NavBar;
