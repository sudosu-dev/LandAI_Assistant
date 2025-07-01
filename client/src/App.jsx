import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="app-layout">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
