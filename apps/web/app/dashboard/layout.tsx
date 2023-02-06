'use client';
import Sidebar from '@components/Sidebar';
import { DashboardProvider } from '@lib/context/dashboardContext';
import fetchJson from '@lib/fetch';
import classes from '@styles/DashboardLayout.module.css';
import { SWRConfig } from 'swr';

type LayoutProps = {
  children: React.ReactNode;
};

function DashboardLayout({ children }: LayoutProps) {
  return (
    <>
      <SWRConfig
        value={{
          fetcher: fetchJson,
          onError: (error) => {
            console.error(error);
          },
        }}
      >
        <DashboardProvider>
          <main className={classes.container}>
            <Sidebar />
            <section className={classes.body}>{children}</section>
          </main>
        </DashboardProvider>
      </SWRConfig>
    </>
  );
}

export default DashboardLayout;
