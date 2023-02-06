'use client';
import { useDashboardContext } from '@lib/context/dashboardContext';

function Dashboard() {
  const { user } = useDashboardContext();
  return <div> hello {user?.username} </div>;
}

export default Dashboard;
