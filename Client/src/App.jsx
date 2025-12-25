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

import TripOptionPage from "./pages/TripOption.jsx";
import AccommodationOptionPage from "./pages/AccommodationOptionPage";
import HotelSelectionPage from "./pages/HotelSelectionPage";
import ItineraryPage from "./pages/ItineraryPage";

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

          <Route path="/transport-selection/:tripId" element={
            <ProtectedRoute><TransportSelectionPage /></ProtectedRoute>
          } />

          <Route
            path="/accommodation-option/:tripId"
            element={<ProtectedRoute><AccommodationOptionPage /></ProtectedRoute>}
          />

          <Route
            path="/hotel-selection/:tripId"
            element={<ProtectedRoute><HotelSelectionPage /></ProtectedRoute>}
          />


          <Route path="/trip-options/:tripId" element={
            <ProtectedRoute><TripOptionPage /></ProtectedRoute>
          } />

          <Route path="/trip-itinerary/:tripId" element={
            <ProtectedRoute><ItineraryPage /></ProtectedRoute>
          } />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
