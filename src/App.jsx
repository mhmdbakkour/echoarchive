import { useEffect, useState } from "react";
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
    const init = useRecordingStore.getState().init;
    if (typeof init === "function") init();
  }, []);

  const [sessionRecordings, setSessionRecordings] = useState([]);

  const handleNewRecording = (rec) => {
    setSessionRecordings((s) => [rec, ...s]);
  };

  const handleRemoveSession = (id) => {
    setSessionRecordings((s) => s.filter((r) => String(r.id) !== String(id)));
  };

  const handleSaved = (rec) => {
    setSessionRecordings((s) =>
      s.filter((r) => String(r.id) !== String(rec.id))
    );
  };

  return (
    <div className="App">
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route
            path="/record"
            element={
              <Record
                recordings={sessionRecordings}
                onDelete={handleRemoveSession}
                onSaved={handleSaved}
                handleNewRecording={handleNewRecording}
              />
            }
          ></Route>
          <Route path="/archive" element={<Archive />}></Route>
          <Route path="/timeline" element={<Timeline />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
