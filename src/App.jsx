import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Events from "./pages/Events.jsx";
import EventForm from "./pages/EventForm.jsx";
import EventQrCode from "./pages/EventQrCode.jsx";
import Frames from "./pages/Frames.jsx";
import FrameForm from "./pages/FrameForm.jsx";
import FrameAreaConfig from "./pages/FrameAreaConfig.jsx";
import Gallery from "./pages/Gallery.jsx";
import PublicEvent from "./pages/PublicEvent.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/e/:code" element={<PublicEvent />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/eventos" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/eventos/novo" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
        <Route path="/eventos/:eventId" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
        <Route path="/eventos/:eventId/qrcode" element={<ProtectedRoute><EventQrCode /></ProtectedRoute>} />
        <Route path="/eventos/:eventId/galeria" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />

        <Route path="/eventos/:eventId/molduras" element={<ProtectedRoute><Frames /></ProtectedRoute>} />
        <Route path="/eventos/:eventId/molduras/nova" element={<ProtectedRoute><FrameForm /></ProtectedRoute>} />
        <Route path="/eventos/:eventId/molduras/:frameId" element={<ProtectedRoute><FrameForm /></ProtectedRoute>} />
        <Route path="/eventos/:eventId/molduras/:frameId/ajustar" element={<ProtectedRoute><FrameAreaConfig /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
