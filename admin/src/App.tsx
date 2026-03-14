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
import Reviews from "@/pages/Reviews";
import InquiryDetail from "@/pages/InquiryDetail";
import Settings from "@/pages/Settings";
import SubProducts from "@/pages/SubProducts";
import SubServices from "@/pages/SubServices";
import PricingCalculator from "@/pages/PricingCalculator";

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
            <Route path="/inquiries/:id" element={<InquiryDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<SubProducts />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<SubServices />} />
            <Route path="/users" element={<Users />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/calculator" element={<PricingCalculator />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
