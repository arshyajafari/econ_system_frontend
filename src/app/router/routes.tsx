import { Navigate, Route, Routes } from "react-router-dom";

function HomePage() {
  return <div>Econ System</div>;
}

function LoginPage() {
  return <div>Login</div>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<HomePage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
