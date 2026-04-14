/**
 * Main Application Component
 * - Configures Tailwind Theme
 * - Sets up Routing
 * - Provides Theme Context
 */
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ContentProvider } from './contexts/ContentContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalStyles } from './components/GlobalStyles';
import { Toaster } from 'sonner';
import { useTheme } from './contexts/ThemeContext';
import { PublicLayout } from './layouts/PublicLayout';
import { CookieConsent } from './components/CookieConsent';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { useContent } from './contexts/ContentContext';
import { ErrorBoundary, RouteWithBoundary } from './components/ErrorBoundary';
import PageLoaderFallback from './components/PageLoaderFallback';

// Dashboard layouts (lazy — only needed for authenticated users)
const DashboardLayout      = lazy(() => import('./layouts/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const TeamDashboardLayout  = lazy(() => import('./layouts/TeamDashboardLayout').then(m => ({ default: m.TeamDashboardLayout })));
const UserDashboardLayout  = lazy(() => import('./layouts/UserDashboardLayout').then(m => ({ default: m.UserDashboardLayout })));

// ─── Public Pages ─────────────────────────────────────────────────────────────
const Home                   = lazy(() => import('./pages/public/Home'));
const Services               = lazy(() => import('./pages/public/Services'));
const ServiceDetail          = lazy(() => import('./pages/public/ServiceDetail'));
const Portfolio              = lazy(() => import('./pages/public/Portfolio'));
const ProjectDetail          = lazy(() => import('./pages/public/ProjectDetail'));
const Contact                = lazy(() => import('./pages/public/Contact'));
const ContactSuccess         = lazy(() => import('./pages/public/ContactSuccess'));
const Login                  = lazy(() => import('./pages/public/Login'));
const Signup                 = lazy(() => import('./pages/public/Signup'));
const NotFound               = lazy(() => import('./pages/public/NotFound'));
const ServerError            = lazy(() => import('./pages/public/ServerError'));
const StyleGuide             = lazy(() => import('./pages/public/StyleGuide'));
const PrivacyPolicy          = lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService         = lazy(() => import('./pages/public/TermsOfService'));
const CookiesSettings        = lazy(() => import('./pages/public/CookiesSettings'));
const Verification           = lazy(() => import('./pages/public/Verification'));
const Team                   = lazy(() => import('./pages/public/Team'));
const JobApplication         = lazy(() => import('./pages/public/JobApplication'));
const JobPrivacyPolicy       = lazy(() => import('./pages/public/JobPrivacyPolicy'));
const JobApplicationSuccess  = lazy(() => import('./pages/public/JobApplicationSuccess'));
const Careers                = lazy(() => import('./pages/public/Careers'));
const JobDetail              = lazy(() => import('./pages/public/JobDetail'));
const UnderConstruction      = lazy(() => import('./pages/public/UnderConstruction'));
const Maintenance            = lazy(() => import('./pages/public/Maintenance'));
const SkeletonPage           = lazy(() => import('./pages/public/SkeletonPage'));
const LoadingPage            = lazy(() => import('./pages/public/LoadingPage'));
const PageLoader             = lazy(() => import('./pages/public/PageLoader'));
const OAuthCallback          = lazy(() => import('./pages/public/OAuthCallback'));
const OtpVerification        = lazy(() => import('./pages/OtpVerification'));

// ─── Email Templates ──────────────────────────────────────────────────────────
const SignupConfirmation  = lazy(() => import('./pages/emails/SignupConfirmation'));
const EmailVerification  = lazy(() => import('./pages/emails/EmailVerification'));
const PasswordReset      = lazy(() => import('./pages/emails/PasswordReset'));
const ProjectCreated     = lazy(() => import('./pages/emails/ProjectCreated'));
const ProjectCompleted   = lazy(() => import('./pages/emails/ProjectCompleted'));
const FeedbackRequest    = lazy(() => import('./pages/emails/FeedbackRequest'));

// ─── Admin Pages ──────────────────────────────────────────────────────────────
const DashboardHome         = lazy(() => import('./pages/admin/DashboardHome'));
const Messages              = lazy(() => import('./pages/admin/Messages'));
const Projects              = lazy(() => import('./pages/admin/Projects'));
const ServicesAdmin         = lazy(() => import('./pages/admin/ServicesAdmin'));
const CategoriesAdmin       = lazy(() => import('./pages/admin/CategoriesAdmin'));
const AITools               = lazy(() => import('./pages/admin/AITools'));
const ChatbotManager        = lazy(() => import('./pages/admin/ChatbotManager'));
const Support               = lazy(() => import('./pages/admin/Support'));
const Notifications         = lazy(() => import('./pages/admin/Notifications'));
const Settings              = lazy(() => import('./pages/admin/Settings'));
const ContentEditor         = lazy(() => import('./pages/admin/ContentEditor'));
const TeamManagement        = lazy(() => import('./pages/admin/TeamManagement'));
const JobManagement         = lazy(() => import('./pages/admin/JobManagement'));
const AdminJobApplications  = lazy(() => import('./pages/admin/AdminJobApplications'));
const ClientManagement      = lazy(() => import('./pages/admin/ClientManagement'));
const ContactManagement     = lazy(() => import('./pages/admin/ContactManagement'));
const DatabaseManager       = lazy(() => import('./pages/admin/DatabaseManager'));
const ClientProjectRequests = lazy(() => import('./pages/admin/ClientProjectRequests'));
const PageManager           = lazy(() => import('./pages/admin/PageManager'));
const AnnouncementManager   = lazy(() => import('./pages/admin/AnnouncementManager'));
const PerformanceMonitor    = lazy(() => import('./pages/admin/PerformanceMonitor'));
const NavFooterManager      = lazy(() => import('./pages/admin/NavFooterManager'));

// ─── Team Pages ───────────────────────────────────────────────────────────────
const TeamDashboardHome       = lazy(() => import('./pages/team/TeamDashboardHome'));
const TeamProjects            = lazy(() => import('./pages/team/TeamProjects'));
const TeamProjectDetail       = lazy(() => import('./pages/team/TeamProjectDetail'));
const TeamTasks               = lazy(() => import('./pages/team/TeamTasks'));
const TeamReports             = lazy(() => import('./pages/team/TeamReports'));
const TeamNotifications       = lazy(() => import('./pages/team/TeamNotifications'));
const TeamSettings            = lazy(() => import('./pages/team/TeamSettings'));
const TeamCalendar            = lazy(() => import('./pages/team/TeamCalendar'));
const TeamChat                = lazy(() => import('./pages/team/TeamChat'));
const TeamResources           = lazy(() => import('./pages/team/TeamResources'));
const TeamClientRequestDetail = lazy(() => import('./pages/team/TeamClientRequestDetail'));
const TeamSupport             = lazy(() => import('./pages/team/TeamSupport'));
const TeamAIChat              = lazy(() => import('./pages/team/TeamAIChat'));
const TeamAppliedJobs         = lazy(() => import('./pages/team/TeamAppliedJobs'));

// ─── User Pages ───────────────────────────────────────────────────────────────
const UserDashboardHome  = lazy(() => import('./pages/user/UserDashboardHome'));
const UserProjects       = lazy(() => import('./pages/user/UserProjects'));
const UserChat           = lazy(() => import('./pages/user/UserChat'));
const UserAIChat         = lazy(() => import('./pages/user/UserAIChat'));
const UserProfile        = lazy(() => import('./pages/user/UserProfile'));
const UserNotifications  = lazy(() => import('./pages/user/UserNotifications'));
const UserAppliedJobs    = lazy(() => import('./pages/user/UserAppliedJobs'));
const UserBilling        = lazy(() => import('./pages/user/UserBilling'));
const UserSupport        = lazy(() => import('./pages/user/UserSupport'));

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

// Syncs admin-set globalTheme from ContentContext into ThemeContext on load/change
function GlobalThemeSyncer() {
  const { globalTheme } = useContent();
  const { setTheme } = useTheme();
  useEffect(() => {
    if (globalTheme === 'dark' || globalTheme === 'light') {
      setTheme(globalTheme);
    }
  }, [globalTheme]);
  return null;
}

function ToasterWrapper() {
  const { theme } = useTheme();
  return (
    <Toaster
      richColors
      closeButton
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
      <CookieConsentProvider>
      <LanguageProvider>
      <AuthProvider>
      <SocketProvider>
      <ContentProvider>
        <GlobalThemeSyncer />
        <GlobalStyles />
        <ToasterWrapper />
        <div className="min-h-screen bg-background text-foreground font-sans antialiased">
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CookieConsent />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<RouteWithBoundary component={Home} />} />
                <Route path="/services" element={<RouteWithBoundary component={Services} />} />
                <Route path="/services/:slug" element={<RouteWithBoundary component={ServiceDetail} />} />
                <Route path="/portfolio" element={<RouteWithBoundary component={Portfolio} />} />
                <Route path="/portfolio/:slug" element={<RouteWithBoundary component={ProjectDetail} />} />
                <Route path="/contact" element={<RouteWithBoundary component={Contact} />} />
                <Route path="/contact/success" element={<RouteWithBoundary component={ContactSuccess} />} />
                <Route path="/login" element={<RouteWithBoundary component={Login} />} />
                <Route path="/signup" element={<RouteWithBoundary component={Signup} />} />
                <Route path="/500" element={<RouteWithBoundary component={ServerError} />} />
                <Route path="/style-guide" element={<RouteWithBoundary component={StyleGuide} />} />
                <Route path="/privacy" element={<RouteWithBoundary component={PrivacyPolicy} />} />
                <Route path="/terms" element={<RouteWithBoundary component={TermsOfService} />} />
                <Route path="/cookies" element={<RouteWithBoundary component={CookiesSettings} />} />
                <Route path="/verification" element={<RouteWithBoundary component={Verification} />} />
                <Route path="/our-team" element={<RouteWithBoundary component={Team} />} />
                <Route path="/careers" element={<RouteWithBoundary component={Careers} />} />
                <Route path="/careers/:id" element={<RouteWithBoundary component={JobDetail} />} />
                <Route path="/careers/apply" element={<RouteWithBoundary component={JobApplication} />} />
                <Route path="/careers/apply/success" element={<RouteWithBoundary component={JobApplicationSuccess} />} />
                <Route path="/careers/privacy" element={<RouteWithBoundary component={JobPrivacyPolicy} />} />
                <Route path="/coming-soon" element={<RouteWithBoundary component={UnderConstruction} />} />
                <Route path="/maintenance" element={<RouteWithBoundary component={Maintenance} />} />
                <Route path="/skeleton" element={<RouteWithBoundary component={SkeletonPage} />} />
                <Route path="/loading" element={<RouteWithBoundary component={LoadingPage} />} />
                <Route path="/page-loader" element={<RouteWithBoundary component={PageLoader} />} />
                <Route path="/emails/signup-confirmation" element={<RouteWithBoundary component={SignupConfirmation} />} />
                <Route path="/emails/email-verification" element={<RouteWithBoundary component={EmailVerification} />} />
                <Route path="/emails/password-reset" element={<RouteWithBoundary component={PasswordReset} />} />
                <Route path="/emails/project-created" element={<RouteWithBoundary component={ProjectCreated} />} />
                <Route path="/emails/project-completed" element={<RouteWithBoundary component={ProjectCompleted} />} />
                <Route path="/emails/feedback-request" element={<RouteWithBoundary component={FeedbackRequest} />} />
                <Route path="/otp-verification" element={<RouteWithBoundary component={OtpVerification} />} />
                <Route path="/auth/callback" element={<RouteWithBoundary component={OAuthCallback} />} />
                <Route path="*" element={<RouteWithBoundary component={NotFound} />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoaderFallback />}>
                      <DashboardLayout />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route index element={<RouteWithBoundary component={DashboardHome} />} />
                <Route path="messages" element={<RouteWithBoundary component={Messages} />} />
                <Route path="projects" element={<RouteWithBoundary component={Projects} />} />
                <Route path="services" element={<RouteWithBoundary component={ServicesAdmin} />} />
                <Route path="categories" element={<RouteWithBoundary component={CategoriesAdmin} />} />
                <Route path="ai-tools" element={<RouteWithBoundary component={AITools} />} />
                <Route path="chatbot-manager" element={<RouteWithBoundary component={ChatbotManager} />} />
                <Route path="support" element={<RouteWithBoundary component={Support} />} />
                <Route path="notifications" element={<RouteWithBoundary component={Notifications} />} />
                <Route path="team" element={<RouteWithBoundary component={TeamManagement} />} />
                <Route path="clients" element={<RouteWithBoundary component={ClientManagement} />} />
                <Route path="client-requests" element={<RouteWithBoundary component={ClientProjectRequests} />} />
                <Route path="contacts" element={<RouteWithBoundary component={ContactManagement} />} />
                <Route path="jobs" element={<RouteWithBoundary component={JobManagement} />} />
                <Route path="job-applications" element={<RouteWithBoundary component={AdminJobApplications} />} />
                <Route path="database" element={<RouteWithBoundary component={DatabaseManager} />} />
                <Route path="announcements" element={<RouteWithBoundary component={AnnouncementManager} />} />
                <Route path="page-manager" element={<RouteWithBoundary component={PageManager} />} />
                <Route path="nav-footer" element={<RouteWithBoundary component={NavFooterManager} />} />
                <Route path="content-editor" element={<RouteWithBoundary component={ContentEditor} />} />
                <Route path="settings" element={<RouteWithBoundary component={Settings} />} />
                <Route path="performance" element={<RouteWithBoundary component={PerformanceMonitor} />} />
              </Route>

              {/* Team Dashboard Routes */}
              <Route path="/team" element={
                <ProtectedRoute allowedRoles={['admin', 'team']}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoaderFallback />}>
                      <TeamDashboardLayout />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route index element={<RouteWithBoundary component={TeamDashboardHome} />} />
                <Route path="projects" element={<RouteWithBoundary component={TeamProjects} />} />
                <Route path="projects/:id" element={<RouteWithBoundary component={TeamProjectDetail} />} />
                <Route path="client-requests/:id" element={<RouteWithBoundary component={TeamClientRequestDetail} />} />
                <Route path="tasks" element={<RouteWithBoundary component={TeamTasks} />} />
                <Route path="reports" element={<RouteWithBoundary component={TeamReports} />} />
                <Route path="calendar" element={<RouteWithBoundary component={TeamCalendar} />} />
                <Route path="chat" element={<RouteWithBoundary component={TeamChat} />} />
                <Route path="resources" element={<RouteWithBoundary component={TeamResources} />} />
                <Route path="notifications" element={<RouteWithBoundary component={TeamNotifications} />} />
                <Route path="settings" element={<RouteWithBoundary component={TeamSettings} />} />
                <Route path="ai-assistant" element={<RouteWithBoundary component={TeamAIChat} />} />
                <Route path="support" element={<RouteWithBoundary component={TeamSupport} />} />
                <Route path="applied-jobs" element={<RouteWithBoundary component={TeamAppliedJobs} />} />
              </Route>

              {/* User Dashboard Routes */}
              <Route path="/user-dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'team', 'user']}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoaderFallback />}>
                      <UserDashboardLayout />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route index element={<RouteWithBoundary component={UserDashboardHome} />} />
                <Route path="projects" element={<RouteWithBoundary component={UserProjects} />} />
                <Route path="messages" element={<RouteWithBoundary component={UserChat} />} />
                <Route path="ai-assistant" element={<RouteWithBoundary component={UserAIChat} />} />
                <Route path="applied-jobs" element={<RouteWithBoundary component={UserAppliedJobs} />} />
                <Route path="billing" element={<RouteWithBoundary component={UserBilling} />} />
                <Route path="profile" element={<RouteWithBoundary component={UserProfile} />} />
                <Route path="notifications" element={<RouteWithBoundary component={UserNotifications} />} />
                <Route path="support" element={<RouteWithBoundary component={UserSupport} />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </div>
      </ContentProvider>
      </SocketProvider>
      </AuthProvider>
      </LanguageProvider>
      </CookieConsentProvider>
    </ThemeProvider>
  );
}
