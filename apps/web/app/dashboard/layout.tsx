'use client';
import classes from '@styles/DashboardLayout.module.css';
import Sidebar from '@components/Sidebar';
import { SWRConfig } from 'swr';
import fetchJson from '@lib/fetch';
import { DashboardProvider } from '@lib/context/dashboardContext';

type LayoutProps = {
  children: React.ReactNode;
};

function DashboardLayout({ children }: LayoutProps) {
  return (
    <>
      <DashboardProvider>
        <SWRConfig
          value={{
            fetcher: fetchJson,
            onError: (error) => {
              console.error(error);
            },
          }}
        >
          <main className={classes.container}>
            {/* <Sidebar /> */}
            <section className={classes.body}>{children}</section>
          </main>
        </SWRConfig>
      </DashboardProvider>
    </>
  );
}

export default DashboardLayout;
