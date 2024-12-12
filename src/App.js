import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, Box } from "@mui/material"; // Importando Box
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MyProSidebarProvider } from "./pages/global/sidebar/sidebarContext";

import MyProSidebar from "./pages/global/sidebar/MyProSidebar";
import Topbar from "./pages/global/Topbar";

import Dashboard from "./pages/dashboard";
import DashboardNNovup from "./pages/dashboardnnovup";
import Team from "./pages/team";
import Invoices from "./pages/invoices";
import Contacts from "./pages/contacts";
import Form from "./pages/form";
import Calendar from "./pages/calendar";
import Bar from "./pages/bar";
import Line from "./pages/line";
import Pie from "./pages/pie";
import FAQ from "./pages/faq";
import Geography from "./pages/geography";
import CreateVM from "./pages/createVM";
import ManageVMs from "./pages/manageVMs";
import ManageVMsCecyber from "./pages/manageVMscecyber";
import Automation from "./pages/automation";
import AutomationNNovup from "./pages/automationVMnnovup";
import Files from "./pages/files";
import Login from "./pages/login";
import Register from "./pages/register";
import Test from "./pages/test";

// Protected Route Component
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("proxmoxToken");
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const [theme, colorMode] = useMode();
  const location = useLocation();

  // Verifica se a rota atual é pública (login ou registro)
  const isPublicPage = ["/login", "/register"].includes(location.pathname);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MyProSidebarProvider>
          <Box
            sx={{
              display: "flex",
              flexDirection: isPublicPage ? "column" : "row",
              minHeight: "100vh",
              width: "100%",
            }}
          >
            {/* Renderiza MyProSidebar e Topbar apenas em páginas protegidas */}
            {!isPublicPage && <MyProSidebar />}
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                padding: !isPublicPage ? "20px" : "0",
              }}
            >
              {!isPublicPage && <Topbar />}
              <Routes>
                {/* Páginas públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Rotas protegidas */}
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/dashboardnnovup"
                  element={
                    <RequireAuth>
                      <DashboardNNovup />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/team"
                  element={
                    <RequireAuth>
                      <Team />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <RequireAuth>
                      <Contacts />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <RequireAuth>
                      <Invoices />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/form"
                  element={
                    <RequireAuth>
                      <Form />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/bar"
                  element={
                    <RequireAuth>
                      <Bar />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/pie"
                  element={
                    <RequireAuth>
                      <Pie />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/line"
                  element={
                    <RequireAuth>
                      <Line />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/faq"
                  element={
                    <RequireAuth>
                      <FAQ />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <RequireAuth>
                      <Calendar />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/geography"
                  element={
                    <RequireAuth>
                      <Geography />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/createVM"
                  element={
                    <RequireAuth>
                      <CreateVM />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/manageVMs"
                  element={
                    <RequireAuth>
                      <ManageVMs />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/ManageVMsCecyber"
                  element={
                    <RequireAuth>
                      <ManageVMsCecyber />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/automation"
                  element={
                    <RequireAuth>
                      <Automation />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/automationVMnnovup"
                  element={
                    <RequireAuth>
                      <AutomationNNovup />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/Files"
                  element={
                    <RequireAuth>
                      <Files />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/test"
                  element={
                    <RequireAuth>
                      <Test />
                    </RequireAuth>
                  }
                />
                {/* Redireciona rotas desconhecidas para login */}
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </Box>
          </Box>
        </MyProSidebarProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
