'use client';
import UserCard from '@components/features/UserCard';
import { useDashboardContext } from '@lib/context/dashboardContext';

function Dashboard() {
  const { user } = useDashboardContext();
  return (
    <>
      <UserCard />
    </>
  );
}

export default Dashboard;
