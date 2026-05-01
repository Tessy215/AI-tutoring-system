import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Assignments from "./pages/Assignments";
import Progress from "./pages/Progress";
import Recommendations from "./pages/Recommendations";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="progress" element={<Progress />} />
      </Route>
    </Routes>
  );
}

export default App;