import React from "react";
import {
  Navigate,
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom"; // Import Routes instead of Switch
import {
  RegistrationPage,
  UserHomePage,
  LoginPage,
  PreviewPage,
  CreateJourneyPage,
  PageNotFound,
  ProfilePage,
  MyJourneysPage,
  JourneyRecommendationsPage,
  JourneyNavigatePage,
  ConversationListPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./webpages"; // Import your pages
import { useAuth } from "./contexts/authContext"; // Import the useAuth hook
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import "font-awesome/css/font-awesome.min.css";

const App = () => {
  const { isAuthenticated } = useAuth(); // Access authentication status

  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />}
          />
          <Route
            path="/verify"
            element={
              !isAuthenticated ? <VerifyEmailPage /> : <Navigate to="/home" />
            }
          />
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />}
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? <RegistrationPage /> : <Navigate to="/home" />
            }
          />

          <Route
            path="/forgot-password"
            element={
              !isAuthenticated ? (
                <ForgotPasswordPage />
              ) : (
                <Navigate to="/home" />
              )
            }
          />

          <Route
            path="/reset-password"
            element={
              !isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/home" />
            }
          />

          <Route
            path="/home"
            element={
              <ProtectedRoute element={<UserHomePage />} /> // Protect the route by checking server authentication
            }
          />

          <Route
            path="/create-journey"
            element={
              <ProtectedRoute element={<CreateJourneyPage />} /> // Protect the route by checking server authentication
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute element={<ProfilePage />} /> // Protect the route by checking server authentication
            }
          />

          <Route
            path="/my-journeys"
            element={
              <ProtectedRoute element={<MyJourneysPage />} /> // Protect the route by checking server authentication
            }
          />

          <Route
            path="/journey-recommendations/"
            element={
              <ProtectedRoute element={<JourneyRecommendationsPage />} /> // Protect the route by checking server authentication
            }
          />

          <Route
            path="/journey-navigate/:userJourneyId"
            element={
              <ProtectedRoute element={<JourneyNavigatePage />} /> // Protect the route by checking server authentication
            }
          />

          <Route
            path="/conversations"
            element={
              <ProtectedRoute element={<ConversationListPage />} /> // Protect the route by checking server authentication
            }
          />

          <Route path="/preview" element={<PreviewPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
