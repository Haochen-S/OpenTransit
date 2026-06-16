import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OtpVerifyPage } from "./pages/OtpVerifyPage";
import { NewTripPage } from "./pages/NewTripPage";
import { TripSchedulePage } from "./pages/TripSchedulePage";

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/new" element={<NewTripPage />} />
              <Route path="/trip" element={<TripSchedulePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/otp" element={<OtpVerifyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
