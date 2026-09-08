// Completely rewritten app pulling from Clerk natively
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from "@clerk/clerk-react";
import { ProProvider } from "./context/ProContext";
import { AdminProvider } from "./context/AdminContext";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import AdminRoute from "./components/AdminRoute";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import AddIncome from "./pages/AddIncome";
import Budget from "./pages/Budget";
import Family from "./pages/Family";
import Profile from "./pages/Profile";
import HelpCenter from "./pages/HelpCenter";
import AdminPayments from "./pages/AdminPayments";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  if (!clerkPubKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#1a1d29', color: '#fff', textAlign: 'center', padding: '24px' }}>
        <h2 style={{ color: '#ef4444' }}>Configuration Error</h2>
        <p style={{ color: '#94a3b8' }}>VITE_CLERK_PUBLISHABLE_KEY is missing. Please check your environment variables.</p>
      </div>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      appearance={{
        variables: {
          colorPrimary: "#7c3aed",
          colorBackground: "#1a1d29",
          colorText: "#ffffff",
          colorTextSecondary: "#94a3b8",
          colorSecondary: "#94a3b8",
          colorAlphaSecondary: "rgba(255, 255, 255, 0.1)",
          colorInputBackground: "#11131f",
          colorInputText: "#ffffff",
          colorInputTextSecondary: "#94a3b8",
          colorDanger: "#ef4444",
          colorSuccess: "#10b981",
          borderRadius: "12px",
          fontFamily: "'Inter', sans-serif"
        },
        elements: {
          card: {
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
          formButtonPrimary: {
            background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            border: "none",
          },
          socialButtonsBlockButton: {
            color: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          userButtonPopoverActionButton: {
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#ffffff !important",
            }
          },
          userButtonPopoverActionButtonText: {
            color: "#ffffff",
            fontWeight: "600",
            "&:hover": {
              color: "#ffffff !important",
            }
          },
          userButtonPopoverActionButtonIcon: {
            color: "#a78bfa",
          },
          userButtonPopoverCard: {
            backgroundColor: "#1a1d29",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
            maxWidth: "min(350px, calc(100vw - 32px))", 
            width: "100%",
            boxSizing: "border-box",
          },
          userButtonPopoverFooter: {
            display: "none",
          },
          // Fix for the UserProfile modal (Manage Account)
          badge: {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            color: "#94a3b8",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "2px 8px",
            fontWeight: "600",
          },
          navbarButton: {
            color: "#94a3b8",
            "&:hover": {
              color: "#ffffff",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            }
          },
          profileSectionTitleText: {
            color: "#ffffff",
            fontWeight: "700",
          },
          userPreviewSecondaryIdentifier: {
            color: "#94a3b8",
          },
          accordionTriggerButton: {
            color: "#ffffff",
          },
          breadcrumbItem: {
             color: "#94a3b8",
          }
        }
      }}
    >
      <ProProvider>
        <AdminProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 500
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              duration: 3000
            }}
          />
          <BrowserRouter>
            <Routes>
                {/* Public auth routes showing Clerk components */}
                <Route 
                  path="/sign-in/*" 
                  element={
                    <div className="auth-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
                      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
                    </div>
                  } 
                />
                <Route 
                  path="/sign-up/*" 
                  element={
                    <div className="auth-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
                      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
                    </div>
                  } 
                />

                {/* Protected routes */}
                <Route
                  element={
                    <>
                      <SignedIn>
                        <Layout />
                      </SignedIn>
                      <SignedOut>
                        <Navigate to="/sign-in" />
                      </SignedOut>
                    </>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/expenses" element={<AddExpense />} />
                  <Route path="/income" element={<AddIncome />} />
                  <Route path="/budget" element={<Budget />} />
                  <Route path="/family" element={<Family />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/help" element={<HelpCenter />} />

                  {/* Admin Protected Routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin/payments" element={<AdminPayments />} />
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </BrowserRouter>
          </AdminProvider>
        </ProProvider>
    </ClerkProvider>
  );
}

export default App;