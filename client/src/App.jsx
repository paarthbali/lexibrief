import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Judgments from "./pages/Judgments";
import JudgmentDetail from "./pages/JudgmentDetail";
import Upload from "./pages/Upload";
import Hearings from "./pages/Hearings";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/judgments" element={<Judgments />} />
        <Route path="/judgments/:id" element={<JudgmentDetail />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/hearings" element={<Hearings />} />
      </Route>

      <Route path="/" element={<Landing />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
