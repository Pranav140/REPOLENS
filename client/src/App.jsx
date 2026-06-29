import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <h1 className="text-3xl font-bold">App works</h1>
      </div>
      <Routes>
        {/* Router configuration placeholders */}
      </Routes>
    </Router>
  );
}

export default App;
