import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Button, Layout, Menu, Spin } from "antd";
import type { MenuProps } from "antd";
import {
  ApartmentOutlined,
  BookOutlined,
  CalendarOutlined,
  CommentOutlined,
  NotificationOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { selfTreePath } from "./api";
import { useAuth } from "./auth";

const { Header, Sider, Content } = Layout;

const TreePage = lazy(() => import("./pages/TreePage"));
const AddressPage = lazy(() => import("./pages/AddressPage"));
const LienPage = lazy(() => import("./pages/LienPage"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const RulesPage = lazy(() => import("./pages/RulesPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));

const MENU: MenuProps["items"] = [
  { key: "/tree", icon: <ApartmentOutlined />, label: "Phả đồ" },
  { key: "/address", icon: <CommentOutlined />, label: "Xưng hô" },
  { key: "/lien", icon: <ShareAltOutlined />, label: "Liên họ" },
  { key: "/members", icon: <TeamOutlined />, label: "Thành viên" },
  { key: "/news", icon: <NotificationOutlined />, label: "Tin tức" },
  { key: "/events", icon: <CalendarOutlined />, label: "Sự kiện" },
  { key: "/rules", icon: <BookOutlined />, label: "Quy tắc" },
  { key: "/account", icon: <UserOutlined />, label: "Tài khoản" },
];

function ScreenStatus({ label }: { label: string }) {
  return (
    <div className="center-screen" role="status" aria-live="polite" aria-label={label}>
      <Spin size="large" />
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <ScreenStatus label="Đang kiểm tra đăng nhập" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <a className="skip" href="#main">
        Đến nội dung
      </a>
      <Sider breakpoint="lg" collapsedWidth={0} theme="light" width={232}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            GP
          </span>
          <span>
            <strong>Gia phả</strong>
            <small>Dòng họ</small>
          </span>
        </div>
        <nav aria-label="Mục chính">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={MENU}
            onClick={({ key }) => navigate(key)}
          />
        </nav>
      </Sider>
      <Layout>
        <Header className="topbar">
          <span className="topbar-user">{user?.name || user?.email}</span>
          {user?.role === "member" && user.personId ? (
            <Button type="primary" onClick={() => navigate(selfTreePath(user))}>
              Vị trí của tôi
            </Button>
          ) : null}
          <Button
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Đăng xuất
          </Button>
        </Header>
        <Content id="main" className="main">
          <Suspense fallback={<ScreenStatus label="Đang mở trang" />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}

export function App() {
  return (
    <Suspense fallback={<ScreenStatus label="Đang mở trang" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/tree" replace />} />
            <Route path="/tree" element={<TreePage />} />
            <Route path="/address" element={<AddressPage />} />
            <Route path="/lien" element={<LienPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/tree" replace />} />
      </Routes>
    </Suspense>
  );
}
