import { useEffect } from "react";
import "./App.css";
import "./styles/global.css";
import NavBar from "./components/navBar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Record from "./pages/Record";
import Archive from "./pages/Archive";
import Timeline from "./pages/Timeline";
import useRecordingStore from "./stores/recordingStore";

function App() {
  useEffect(() => {
    // initialize recordings: load from IndexedDB then fetch/merge from backend
    const init = useRecordingStore.getState().init;
    if (typeof init === "function") init();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/record" element={<Record />}></Route>
          <Route path="/archive" element={<Archive />}></Route>
          <Route path="/timeline" element={<Timeline />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
