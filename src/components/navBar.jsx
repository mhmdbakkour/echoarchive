import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import "../styles/navBar.css";

function NavBar() {
  return (
    <nav className="navigation">
      <div className="nav-title">
        <img src={logo} className="nav-logo"></img>
        <div className="nav-app-name">Echo Archive</div>
      </div>
      <div className="nav-links">
        <Link to={"/"}>Home</Link>
        <Link to={"/record"}>Record</Link>
        <Link to={"/archive"}>Archive</Link>
        <Link to={"/timeline"}>Timeline</Link>
      </div>
    </nav>
  );
}

export default NavBar;
