/**
 * Main Application Component
 * - Configures Tailwind Theme
 * - Sets up Routing
 * - Provides Theme Context
 */
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ContentProvider } from './contexts/ContentContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalStyles } from './components/GlobalStyles';
import { Toaster } from 'sonner';
import { useTheme } from './contexts/ThemeContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/public/Home';
import Services from './pages/public/Services';
import ServiceDetail from './pages/public/ServiceDetail';
import Portfolio from './pages/public/Portfolio';
import ProjectDetail from './pages/public/ProjectDetail';
import Contact from './pages/public/Contact';
import ContactSuccess from './pages/public/ContactSuccess';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import NotFound from './pages/public/NotFound';
import ServerError from './pages/public/ServerError';
import StyleGuide from './pages/public/StyleGuide';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import CookiesSettings from './pages/public/CookiesSettings';
import Verification from './pages/public/Verification';
import Team from './pages/public/Team';
import JobApplication from './pages/public/JobApplication';
import JobPrivacyPolicy from './pages/public/JobPrivacyPolicy';
import JobApplicationSuccess from './pages/public/JobApplicationSuccess';
import Careers from './pages/public/Careers';
import JobDetail from './pages/public/JobDetail';
import UnderConstruction from './pages/public/UnderConstruction';
import Maintenance from './pages/public/Maintenance';
import SkeletonPage from './pages/public/SkeletonPage';
import LoadingPage from './pages/public/LoadingPage';
import PageLoader from './pages/public/PageLoader';

// Email Templates
import SignupConfirmation from './pages/emails/SignupConfirmation';
import EmailVerification from './pages/emails/EmailVerification';
import PasswordReset from './pages/emails/PasswordReset';
import ProjectCreated from './pages/emails/ProjectCreated';
import ProjectCompleted from './pages/emails/ProjectCompleted';
import FeedbackRequest from './pages/emails/FeedbackRequest';
import OtpVerification from './pages/OtpVerification';

// Admin Pages
import DashboardHome from './pages/admin/DashboardHome';
import Messages from './pages/admin/Messages';
import Projects from './pages/admin/Projects';
import ServicesAdmin from './pages/admin/ServicesAdmin';
import CategoriesAdmin from './pages/admin/CategoriesAdmin';
import AITools from './pages/admin/AITools';
import Billing from './pages/admin/Billing';
import Support from './pages/admin/Support';
import Notifications from './pages/admin/Notifications';
import Settings from './pages/admin/Settings';
import ContentEditor from './pages/admin/ContentEditor';
import TeamManagement from './pages/admin/TeamManagement';
import JobManagement from './pages/admin/JobManagement';
import AdminJobApplications from './pages/admin/AdminJobApplications';
import ClientManagement from './pages/admin/ClientManagement';
import ContactManagement from './pages/admin/ContactManagement';
import DatabaseManager from './pages/admin/DatabaseManager';
import ClientProjectRequests from './pages/admin/ClientProjectRequests';
import PageManager from './pages/admin/PageManager';
import AnnouncementManager from './pages/admin/AnnouncementManager';

// Team Dashboard Pages
import { TeamDashboardLayout } from './layouts/TeamDashboardLayout';
import TeamDashboardHome from './pages/team/TeamDashboardHome';
import TeamProjects from './pages/team/TeamProjects';
import TeamProjectDetail from './pages/team/TeamProjectDetail';
import TeamTasks from './pages/team/TeamTasks';
import TeamReports from './pages/team/TeamReports';
import TeamNotifications from './pages/team/TeamNotifications';
import TeamSettings from './pages/team/TeamSettings';
import TeamCalendar from './pages/team/TeamCalendar';
import TeamChat from './pages/team/TeamChat';
import TeamResources from './pages/team/TeamResources';
import TeamClientRequestDetail from './pages/team/TeamClientRequestDetail';
import TeamSupport from './pages/team/TeamSupport';

// User Dashboard Pages
import { UserDashboardLayout } from './layouts/UserDashboardLayout';
import UserDashboardHome from './pages/user/UserDashboardHome';
import UserProjects from './pages/user/UserProjects';
import UserChat from './pages/user/UserChat';
import UserAIChat from './pages/user/UserAIChat';
import UserProfile from './pages/user/UserProfile';
import UserNotifications from './pages/user/UserNotifications';
import UserAppliedJobs from './pages/user/UserAppliedJobs';
import UserSupport from './pages/user/UserSupport';

import { CookieConsent } from './components/CookieConsent';

// Configure Tailwind Theme Extension
// This must run before rendering
const configureTailwind = () => {
  if (typeof window !== 'undefined' && window.tailwind) {
    window.tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: {
              DEFAULT: 'hsl(var(--primary))',
              foreground: 'hsl(var(--primary-foreground))',
            },
            secondary: {
              DEFAULT: 'hsl(var(--secondary))',
              foreground: 'hsl(var(--secondary-foreground))',
            },
            destructive: {
              DEFAULT: 'hsl(var(--destructive))',
              foreground: 'hsl(var(--destructive-foreground))',
            },
            muted: {
              DEFAULT: 'hsl(var(--muted))',
              foreground: 'hsl(var(--muted-foreground))',
            },
            accent: {
              DEFAULT: 'hsl(var(--accent))',
              foreground: 'hsl(var(--accent-foreground))',
            },
            popover: {
              DEFAULT: 'hsl(var(--popover))',
              foreground: 'hsl(var(--popover-foreground))',
            },
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))',
            },
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)',
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
          }
        }
      }
    };
  }
};

function ToasterWrapper() {
  const { theme } = useTheme();
  return (
    <Toaster
      richColors
      position="top-right"
      theme={theme as 'light' | 'dark' | 'system'}
      duration={4000}
    />
  );
}

export default function App() {
  useEffect(() => {
    configureTailwind();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="agency-theme">
      <LanguageProvider>
      <AuthProvider>
      <ContentProvider>
        <GlobalStyles />
        <ToasterWrapper />
        <div className="min-h-screen bg-background text-foreground font-sans antialiased">
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CookieConsent />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/portfolio/:slug" element={<ProjectDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/contact/success" element={<ContactSuccess />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/500" element={<ServerError />} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cookies" element={<CookiesSettings />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/our-team" element={<Team />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/careers/:id" element={<JobDetail />} />
                <Route path="/careers/apply" element={<JobApplication />} />
                <Route path="/careers/apply/success" element={<JobApplicationSuccess />} />
                <Route path="/careers/privacy" element={<JobPrivacyPolicy />} />
                <Route path="/coming-soon" element={<UnderConstruction />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/skeleton" element={<SkeletonPage />} />
                <Route path="/loading" element={<LoadingPage />} />
                <Route path="/page-loader" element={<PageLoader />} />
                
                {/* Email Templates */}
                <Route path="/emails/signup-confirmation" element={<SignupConfirmation />} />
                <Route path="/emails/email-verification" element={<EmailVerification />} />
                <Route path="/emails/password-reset" element={<PasswordReset />} />
                <Route path="/emails/project-created" element={<ProjectCreated />} />
                <Route path="/emails/project-completed" element={<ProjectCompleted />} />
                <Route path="/emails/feedback-request" element={<FeedbackRequest />} />
                
                {/* Auth Pages */}
                <Route path="/otp-verification" element={<OtpVerification />} />

                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardHome />} />
                <Route path="messages" element={<Messages />} />
                <Route path="projects" element={<Projects />} />
                <Route path="services" element={<ServicesAdmin />} />
                <Route path="categories" element={<CategoriesAdmin />} />
                <Route path="ai-tools" element={<AITools />} />
                <Route path="billing" element={<Billing />} />
                <Route path="support" element={<Support />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="clients" element={<ClientManagement />} />
                <Route path="client-requests" element={<ClientProjectRequests />} />
                <Route path="contacts" element={<ContactManagement />} />
                <Route path="jobs" element={<JobManagement />} />
                <Route path="job-applications" element={<AdminJobApplications />} />
                <Route path="database" element={<DatabaseManager />} />
                <Route path="announcements" element={<AnnouncementManager />} />
                <Route path="page-manager" element={<PageManager />} />
                <Route path="content-editor" element={<ContentEditor />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Team Dashboard Routes */}
              <Route path="/team" element={
                <ProtectedRoute allowedRoles={['admin', 'team']}>
                  <TeamDashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<TeamDashboardHome />} />
                <Route path="projects" element={<TeamProjects />} />
                <Route path="projects/:id" element={<TeamProjectDetail />} />
                <Route path="client-requests/:id" element={<TeamClientRequestDetail />} />
                <Route path="tasks" element={<TeamTasks />} />
                <Route path="reports" element={<TeamReports />} />
                <Route path="calendar" element={<TeamCalendar />} />
                <Route path="chat" element={<TeamChat />} />
                <Route path="resources" element={<TeamResources />} />
                <Route path="notifications" element={<TeamNotifications />} />
                <Route path="settings" element={<TeamSettings />} />
                <Route path="support" element={<TeamSupport />} />
              </Route>

              {/* User Dashboard Routes */}
              <Route path="/user-dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'team', 'user']}>
                  <UserDashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<UserDashboardHome />} />
                <Route path="projects" element={<UserProjects />} />
                <Route path="messages" element={<UserChat />} />
                <Route path="ai-assistant" element={<UserAIChat />} />
                <Route path="applied-jobs" element={<UserAppliedJobs />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="notifications" element={<UserNotifications />} />
                <Route path="support" element={<UserSupport />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </div>
      </ContentProvider>
      </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}