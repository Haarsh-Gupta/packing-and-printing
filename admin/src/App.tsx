import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Login from "@/components/Login";
import AuthSuccess from "@/pages/AuthSuccess";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Declarations from "@/pages/Declarations";
import Inquiries from "@/pages/Inquiries";
import Products from "@/pages/Products";
import Services from "@/pages/Services";
import Users from "@/pages/Users";
import Tickets from "@/pages/Tickets";
import TicketDetail from "@/pages/TicketDetail";
import Notifications from "@/pages/Notifications";
import Reviews from "@/pages/Reviews";
import Emails from "@/pages/Emails";
import EmailLogs from "@/pages/EmailLogs";
import InquiryDetail from "@/pages/InquiryDetail";
import OrderDetail from "@/pages/OrderDetail";
import UserDetail from "@/pages/UserDetail";
import Settings from "@/pages/Settings";
import SubProducts from "@/pages/SubProducts";
import SubServices from "@/pages/SubServices";
import PricingCalculator from "@/pages/PricingCalculator";
import OfflinePayment from "@/pages/OfflinePayment";
import DeclarationDetail from "@/pages/DeclarationDetail";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/declarations" element={<Declarations />} />
            <Route path="/declarations/:id" element={<DeclarationDetail />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/inquiries/:id" element={<InquiryDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<SubProducts />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<SubServices />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/email-logs" element={<EmailLogs />} />
            <Route path="/calculator" element={<PricingCalculator />} />
            <Route path="/offline-payment" element={<OfflinePayment />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
