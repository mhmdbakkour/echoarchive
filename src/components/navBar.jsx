import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import "../styles/navBar.css";

function NavBar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="navigation" role="navigation" aria-label="Main navigation">
      <div className="nav-title">
        <img src={logo} className="nav-logo" alt="Logo" />
        <div className="nav-app-name">Echo Archive</div>
      </div>

      <button
        className={`nav-toggle${open ? " open" : ""}`}
        aria-controls="nav-links"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <span className="hamburger" />
      </button>

      <div id="nav-links" className={`nav-links${open ? " open" : ""}`}>
        <Link to={"/"} onClick={close}>
          Home
        </Link>
        <Link to={"/record"} onClick={close}>
          Record
        </Link>
        <Link to={"/archive"} onClick={close}>
          Archive
        </Link>
        <Link to={"/timeline"} onClick={close}>
          Timeline
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
