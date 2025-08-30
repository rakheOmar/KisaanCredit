import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// COMPONENTS
import Navbar from "@/components/blocks/Navbar/Navbar";
import Footer from "@/components/Footer";
import ChatBotButton from "@/components/ChatBotButton";
import { Toaster } from "sonner";

// PAGES
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import ContactPage from "@/pages/ContactUs";
import PeerJSVideoCallPage from "@/pages/PeerJSVideoCallPage";
import UserProfile from "@/pages/UserProfile";
import PaymentPage from "@/pages/PaymentPage";
import TransactionVerifier from "@/pages/TransactionVerifier";
import AadhaarVerificationPage from "@/pages/AadhaarVerificationPage";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import GeoRegionSelectorPage from "@/pages/GeoRegionSelectorPage";
import CreateProjectPage from "@/pages/CreateProjectPage";
import ProjectManagersDashboard from "@/pages/ProjectManagersDashboard";
import ProjectDetailsPage from "@/pages/ProjectDetailsPage";
import EstimateEarningsPage from "@/pages/EstimateEarningsPage";
import StartEarningPage from "@/pages/StartEarningPage";

const hiddenLayoutRoutes = ["/login", "/signup", "/dashboard"];

const Layout = ({ children }) => {
  const location = useLocation();
  const hideLayout = hiddenLayoutRoutes.includes(location.pathname);

  const noPaddingRoutes = [];
  const addPadding = !hideLayout && !noPaddingRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" richColors />
      {!hideLayout && <Navbar />}
      <main className={`flex-1 ${addPadding ? "pt-24" : ""}`}>{children}</main>
      {!hideLayout && <Footer />}
      {!hideLayout && <ChatBotButton />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/peer-call" element={<PeerJSVideoCallPage />} />
          <Route path="/peer-call/:roomId" element={<PeerJSVideoCallPage />} />
          <Route path="/user-profile/:id" element={<UserProfile />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/verify-transaction" element={<TransactionVerifier />} />
          <Route path="/aadhaar-verify" element={<AadhaarVerificationPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/map" element={<GeoRegionSelectorPage />} />
          <Route path="/dashboard-project" element={<ProjectManagersDashboard />} />
          <Route path="/dashboard-project/:id" element={<ProjectDetailsPage />} />
          <Route path="/dashboard-project/create-project" element={<CreateProjectPage />} />
          <Route path="/estimate-earnings" element={<EstimateEarningsPage />} />
          <Route path="/start-earning" element={<StartEarningPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
