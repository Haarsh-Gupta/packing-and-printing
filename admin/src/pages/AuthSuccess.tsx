import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { admin, isLoading } = useAuth();

  useEffect(() => {
    // Once loading is finished, check if we have a user
    if (!isLoading) {
      if (admin) {
        navigate("/", { replace: true });
      } else {
        // If still no user after hydration attempt, redirect to login
        navigate("/login?error=GoogleAuthFailed", { replace: true });
      }
    }
  }, [admin, isLoading, navigate]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      background: '#f2f2f7',
      fontFamily: "'Inter', sans-serif"
    }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#71717a' }} />
      <p style={{ color: '#18181b', fontWeight: 500 }}>Authenticating...</p>
    </div>
  );
}
