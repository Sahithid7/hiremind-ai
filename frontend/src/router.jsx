import { createBrowserRouter, Navigate } from "react-router-dom";

import AppLayout from "./layouts/AppLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import CoverLetterExpert from "./pages/CoverLetterExpert.jsx";
import CoverLetterTemplates from "./pages/CoverLetterTemplates.jsx";
import Home from "./pages/Home.jsx";
import Pricing from "./pages/Pricing.jsx";
import HelpSupport from "./pages/HelpSupport.jsx";
import JobMatch from "./pages/JobMatch.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import ResumeAnalysis from "./pages/ResumeAnalysis.jsx";
import ResumeBuilder from "./pages/ResumeBuilder.jsx";
import ResumeExpert from "./pages/ResumeExpert.jsx";
import ResumeTemplates from "./pages/ResumeTemplates.jsx";
import ResumeTips from "./pages/ResumeTips.jsx";
import ResumeUpload from "./pages/ResumeUpload.jsx";
import Signup from "./pages/Signup.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />
  },
  {
    path: "/pricing",
    element: <Pricing />
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> }
    ]
  },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="resume-expert" replace /> },
      { path: "resume-expert", element: <ResumeExpert /> },
      { path: "resume-builder", element: <ResumeBuilder /> },
      { path: "resume-templates", element: <ResumeTemplates /> },
      { path: "resume-tips", element: <ResumeTips /> },
      { path: "resume-upload", element: <ResumeUpload /> },
      { path: "resume-analysis", element: <ResumeAnalysis /> },
      { path: "ats-score", element: <ResumeAnalysis /> },
      { path: "cover-letter-expert", element: <CoverLetterExpert /> },
      { path: "cover-letter", element: <Navigate to="/app/cover-letter-expert" replace /> },
      { path: "cover-letter-checker", element: <Navigate to="/app/cover-letter-expert" replace /> },
      { path: "cover-letter-templates", element: <CoverLetterTemplates /> },
      { path: "job-analytics", element: <JobMatch /> },
      { path: "job-match", element: <Navigate to="/app/job-analytics" replace /> },
      { path: "interview-prep", element: <Navigate to="/app/job-analytics" replace /> },
      { path: "applications", element: <Navigate to="/app/job-analytics" replace /> },
      { path: "settings", element: <Profile /> },
      { path: "profile", element: <Navigate to="/app/settings" replace /> },
      { path: "help", element: <HelpSupport /> }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
