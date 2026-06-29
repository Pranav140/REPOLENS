import React from 'react';

const Login = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold mb-6">Login to RepoLens</h1>
      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90">
        Sign in with GitHub
      </button>
    </div>
  );
};

export default Login;
