import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Articles from './pages/Articles';
import Admin from './pages/Admin';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/articles" component={Articles} />
              <Route path="/admin" component={Admin} />
            </Switch>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
