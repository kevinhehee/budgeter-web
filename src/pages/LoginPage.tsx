import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  function loginWithGoogle() {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  }

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Budgeter</h1>
          <p className="muted">Checking sign-in status...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Budgeter</h1>
        <p className="muted">Sign in with Google to continue</p>

        <button className="primary-button" onClick={loginWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}