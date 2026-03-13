import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { EditUser } from "./pages/EditUser";
import ProtectedRoute from "./components/ProtectedRoute";
import { Staff } from "./pages/Staff";
import { Calendar } from "./pages/Calendar";
/* import ForgotPassword from "./pages/ForgotPassword"; */
import ResetPassword from "./pages/ResetPassword";
import NewAppointment from "./components/NewAppointment";
export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
      {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/single/:theId" element={<ProtectedRoute><Single /></ProtectedRoute>} />
        <Route path="/demo" element={<ProtectedRoute><Demo /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute adminOnly><Calendar /></ProtectedRoute>} />
        <Route path="/signup" element={<ProtectedRoute adminOnly><Signup /></ProtectedRoute>} />
        <Route path="/new-appointment" element={<ProtectedRoute><NewAppointment /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute adminOnly><Staff /></ProtectedRoute>} />
        <Route path="/editUser" element={<ProtectedRoute adminOnly><EditUser /></ProtectedRoute>} />
      </Route>
    </>
  )
);