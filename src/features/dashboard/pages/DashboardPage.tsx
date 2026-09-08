import { useAuth } from "../../auth";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <section>
      <h1>داشبورد</h1>

      <p>خوش آمدید {user?.employee.full_name}</p>
    </section>
  );
}
