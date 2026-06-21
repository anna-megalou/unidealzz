import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Auth guards are enforced. StudentHub + Operations require a logged-in user.
const DEV_OPEN_ACCESS = false;

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireStaff = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
}) => {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const location = useLocation();

  if (DEV_OPEN_ACCESS) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/student-hub" replace />;
  }

  if (requireStaff && !isStaff) {
    return <Navigate to="/student-hub" replace />;
  }

  return <>{children}</>;
};

