import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    const storedAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (storedAdmin) {
      setIsAdmin(true);
    }
  }, []);

  const login = (pin) => {
    if (pin === '1234') { // Configurable through environment or constants in future
      setIsAdmin(true);
      sessionStorage.setItem('isAdmin', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout, showAdminModal, setShowAdminModal }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
