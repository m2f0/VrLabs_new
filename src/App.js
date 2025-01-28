import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, Box } from "@mui/material";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MyProSidebarProvider } from "./pages/global/sidebar/sidebarContext";

import MyProSidebar from "./pages/global/sidebar/MyProSidebar";
import Topbar from "./pages/global/Topbar";

import Dashboard from "./pages/dashboardnnovup";
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
import AutomationNNovupMultiples from "./pages/automationVMnnovupMultiples";
import Files from "./pages/files";
import Login from "./pages/login";
import Register from "./pages/register";
import Test from "./pages/test";

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

                {/* Páginas sem autenticação */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboardnnovup" element={<DashboardNNovup />} />
                <Route path="/team" element={<Team />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/form" element={<Form />} />
                <Route path="/bar" element={<Bar />} />
                <Route path="/pie" element={<Pie />} />
                <Route path="/line" element={<Line />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/geography" element={<Geography />} />
                <Route path="/createVM" element={<CreateVM />} />
                <Route path="/manageVMs" element={<ManageVMs />} />
                <Route path="/ManageVMsCecyber" element={<ManageVMsCecyber />} />
                <Route path="/automation" element={<Automation />} />
                <Route path="/automationVMnnovup" element={<AutomationNNovup />} />
                <Route
                  path="/automationVMnnovupMultiples"
                  element={<AutomationNNovupMultiples />}
                />
                <Route path="/Files" element={<Files />} />
                <Route path="/test" element={<Test />} />
                {/* Redireciona rotas desconhecidas para a página inicial */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Box>
          </Box>
        </MyProSidebarProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
