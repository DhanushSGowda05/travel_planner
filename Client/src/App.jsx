import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Landing from "./pages/Landing";
import DashboardPage from "./pages/DashboardPage";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

import TripFormPage from "./pages/TripFormPage";
import TransportSelectionPage from "./pages/TransportSelectionPage";
import AccommodationSelectionPage from "./pages/AccommodationSelectionPage";
import TripSummaryPage from "./pages/TripSummaryPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public Routes */}
          <Route index element={<Landing />} />

          <Route path="/signin" element={
            <PublicOnlyRoute><SignIn /></PublicOnlyRoute>
          } />

          <Route path="/signup" element={
            <PublicOnlyRoute><SignUp /></PublicOnlyRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          <Route path="/trip/new" element={
            <ProtectedRoute><TripFormPage /></ProtectedRoute>
          } />

          <Route path="/trip/:tripId/transport" element={
            <ProtectedRoute><TransportSelectionPage /></ProtectedRoute>
          } />

          <Route path="/trip/:tripId/accommodation" element={
            <ProtectedRoute><AccommodationSelectionPage /></ProtectedRoute>
          } />

          <Route path="/trip/:tripId/summary" element={
            <ProtectedRoute><TripSummaryPage /></ProtectedRoute>
          } />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
