import { useState } from "react";
import "./App.css";
import NavBar from "./components/navBar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Record from "./pages/Record";
import Archive from "./pages/Archive";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <NavBar></NavBar>
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/record" element={<Record />}></Route>
            <Route path="/archive" element={<Archive />}></Route>
          </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
