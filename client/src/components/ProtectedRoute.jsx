import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';

/**
 * Wraps a route that requires a logged-in Firebase user.
 * While auth state is loading, shows a spinner.
 * If no user, redirects to /login with the current location saved in state
 * so the Login page can redirect back after successful auth.
 */
function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    console.log('[ProtectedRoute] Component mounted, checking auth state...');
    
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log('[ProtectedRoute] Auth state changed!');
      console.log('[ProtectedRoute] firebaseUser:', firebaseUser ? `Logged in as: ${firebaseUser.email || firebaseUser.phoneNumber}` : 'NULL (Logged out)');
      
      setUser(firebaseUser);
      setChecking(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sandstone">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-marigold border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Save where the user was trying to go so Login can redirect back
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export default ProtectedRoute;
