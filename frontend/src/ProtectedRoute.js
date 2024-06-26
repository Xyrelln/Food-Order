import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from './contexts/AuthContext'; // Ensure the path is correct

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  //console.log('ProtectedRoute - User:', user);
  //console.log('ProtectedRoute - Loading:', loading);

  if (loading) {
    return <div>Loading...</div>; // or a loading spinner
  }

  return user ? <Outlet /> : <Navigate to="/owner/login" />;
};

export default ProtectedRoute;
