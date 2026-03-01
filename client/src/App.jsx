import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddMistake from "./pages/AddMistake";
import ProLayout from "./components/ProLayout";
import Register from "./pages/Register";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN ROUTE */}
        <Route
          path="/"
          element={
            token ? <Navigate to="/dashboard" /> : <Login />
          }
        />

        {/* ✅ REGISTER ROUTE (ADD THIS) */}
        <Route
          path="/register"
          element={
            token ? <Navigate to="/dashboard" /> : <Register />
          }
        />

        {/* DASHBOARD (PROTECTED) */}
        <Route
          path="/dashboard"
          element={
            token ? (
              <ProLayout>
                <Dashboard />
              </ProLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* ADD MISTAKE (PROTECTED) */}
        <Route
          path="/add-mistake"
          element={
            token ? (
              <ProLayout>
                <AddMistake />
              </ProLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* CATCH ALL */}
        <Route
          path="*"
          element={<Navigate to={token ? "/dashboard" : "/"} />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;