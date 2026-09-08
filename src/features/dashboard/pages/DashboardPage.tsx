import { useAuth } from "../../auth";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>داشبورد</h1>

      <p>خوش آمدید {user?.employee.full_name}</p>

      <button
        type="button"
        onClick={() => {
          void logout();
        }}
      >
        خروج
      </button>
    </main>
  );
}
