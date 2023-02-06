import '@styles/globals.css';
import React from 'react';

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
