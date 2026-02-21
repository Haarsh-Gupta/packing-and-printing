import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Login from "@/components/Login";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Inquiries from "@/pages/Inquiries";
import Products from "@/pages/Products";
import Services from "@/pages/Services";
import Users from "@/pages/Users";
import Tickets from "@/pages/Tickets";
import Notifications from "@/pages/Notifications";
import Email from "@/pages/Email";
import Reviews from "@/pages/Reviews";
import Settings from "@/pages/Settings";
import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", color: "#ef4444", background: "#fff", minHeight: "100vh" }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>⚠️ React Crash Detected</h1>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fef2f2", padding: 20, borderRadius: 8 }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
            style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/inquiries" element={<Inquiries />} />
              <Route path="/products" element={<Products />} />
              <Route path="/services" element={<Services />} />
              <Route path="/users" element={<Users />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/email" element={<Email />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

