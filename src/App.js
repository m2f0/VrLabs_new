import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import { MyProSidebarProvider } from "./pages/global/sidebar/sidebarContext";

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

const App = () => {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MyProSidebarProvider>
          <div style={{ height: "100%", width: "100%" }}>
            <main>
              <Topbar />
              <Routes>
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
                <Route
                  path="/ManageVMsCecyber"
                  element={<ManageVMsCecyber />}
                />
                <Route path="/automation" element={<Automation />} />
                <Route
                  path="/automationVMnnovup"
                  element={<AutomationNNovup />}
                />
                <Route path="/Files" element={<Files />} />
              </Routes>
            </main>
          </div>
        </MyProSidebarProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
