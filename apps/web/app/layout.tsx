import fetchJson from '@lib/fetch';
import '@styles/globals.css';
import React from 'react';
import { SWRConfig } from 'swr';

interface LayoutProps {
  children: React.ReactNode;
}

function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head />
      <body className="dark-theme">{children}</body>
    </html>
  );
}

export default RootLayout;
