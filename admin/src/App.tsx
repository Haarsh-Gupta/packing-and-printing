import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
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

export default function App() {
  return (
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
