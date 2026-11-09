import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { AuthProvider } from "./auth";
import { App } from "./App";
import "antd/dist/reset.css";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Thiếu #root");

createRoot(root).render(
  <StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#8E1F1A",
          colorBgLayout: "#FBF6E8",
          colorText: "#3C2A1C",
          colorTextBase: "#3C2A1C",
          colorLink: "#8E1F1A",
          colorBorder: "#E4D3B0",
          colorBgContainer: "#FFFDF8",
          fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
          borderRadius: 8,
        },
        components: {
          Layout: {
            headerBg: "#FBF6E8",
            bodyBg: "#FBF6E8",
            siderBg: "#FFFDF8",
            headerHeight: 64,
          },
          Menu: {
            itemSelectedColor: "#8E1F1A",
            itemSelectedBg: "rgba(142, 31, 26, 0.08)",
          },
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
);
