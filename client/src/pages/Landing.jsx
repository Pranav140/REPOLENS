import React from 'react';

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <h1 className="text-4xl font-bold mb-4">RepoLens</h1>
      <p className="text-lg text-muted-foreground text-center max-w-md">
        Visualize, analyze, and gain deep insights into your repositories.
      </p>
    </div>
  );
};

export default Landing;
