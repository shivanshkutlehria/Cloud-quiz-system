import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy-loaded pages
const Login            = lazy(() => import("../pages/Auth/Login"));
const Signup           = lazy(() => import("../pages/Auth/Signup"));
const AdminDashboard   = lazy(() => import("../pages/Admin/AdminDashboard"));
const TeacherDashboard = lazy(() => import("../pages/Teacher/TeacherDashboard"));
const QuizAnalytics    = lazy(() => import("../pages/Teacher/QuizAnalytics"));
const AllReports       = lazy(() => import("../pages/Teacher/AllReports"));
const EditQuiz         = lazy(() => import("../pages/Teacher/EditQuiz"));
const AIQuizGenerator  = lazy(() => import("../pages/Teacher/AIQuizGenerator"));
const StudentDashboard = lazy(() => import("../pages/Student/StudentDashboard"));
const SubjectDetail    = lazy(() => import("../pages/Student/SubjectDetail"));
const QuizAttempt      = lazy(() => import("../pages/Student/QuizAttempt"));
const Result           = lazy(() => import("../pages/Student/Result"));

import ProtectedRoute from "./ProtectedRoute";

/* Minimal fallback shown while a chunk loads */
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
    }}>
      <div style={{
        width: 44,
        height: 44,
        border: "4px solid #e2e8f0",
        borderTopColor: "#667eea",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/"       element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        } />

        {/* Teacher */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>
        } />
        <Route path="/teacher/analytics/:quizId" element={
          <ProtectedRoute allowedRole="teacher"><QuizAnalytics /></ProtectedRoute>
        } />
        <Route path="/teacher/reports" element={
          <ProtectedRoute allowedRole="teacher"><AllReports /></ProtectedRoute>
        } />
        <Route path="/teacher/edit/:quizId" element={
          <ProtectedRoute allowedRole="teacher"><EditQuiz /></ProtectedRoute>
        } />
        <Route path="/teacher/ai-generator" element={
          <ProtectedRoute allowedRole="teacher"><AIQuizGenerator /></ProtectedRoute>
        } />

        {/* Student */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/subject/:subjectId" element={
          <ProtectedRoute allowedRole="student"><SubjectDetail /></ProtectedRoute>
        } />
        <Route path="/quiz/:quizId" element={
          <ProtectedRoute allowedRole="student"><QuizAttempt /></ProtectedRoute>
        } />
        <Route path="/result" element={
          <ProtectedRoute allowedRole="student"><Result /></ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
}