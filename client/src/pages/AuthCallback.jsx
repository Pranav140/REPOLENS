import React from 'react';

const AuthCallback = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <h2 className="text-2xl font-semibold mb-4">Authenticating...</h2>
      <p className="text-muted-foreground">Please wait while we complete the login process.</p>
    </div>
  );
};

export default AuthCallback;
