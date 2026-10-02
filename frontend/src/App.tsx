import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import MemberDashboard from "./pages/member/MemberDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Register from "./pages/auth/Register";

function App() {
  const { user, isAuthenticated } = useAuth();

  return <Routes>
    <Route path="/" element={<Navigate to={isAuthenticated && user ? `/${user.role}` : "/login"} replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute allowedRole="member" />}><Route path="/member" element={<MemberDashboard />} /></Route>
    <Route element={<ProtectedRoute allowedRole="admin" />}><Route path="/admin" element={<AdminDashboard />} /></Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>;
}

export default App;
