import React from 'react';
import { Outlet } from 'react-router-dom';

const RepoLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-64 border-r bg-muted/40 p-4">
        <h3 className="font-semibold text-lg mb-4">Repo Navigation</h3>
        {/* Navigation links will go here */}
      </div>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default RepoLayout;
