import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import UploadPage from './components/UploadPage';
import FileValidityPage from './components/FileValidityPage';
import DownloadPage from './components/DownloadPage';
import VisualizerPage from './components/VisualizerPage';
import GlobalMapPage from './components/GlobalMapPage';
import Layout from './components/Layout';
import { Node } from './types';
import { storage } from './lib/storage';

function App() {
  const [currentNode, setCurrentNode] = useState<Node | null>(() => {
    const savedNode = storage.getCurrentNode();
    const token = storage.getAuthToken();
    if (!token) {
      return null;
    }
    return savedNode;
  });
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLogin = (node: Node) => {
    storage.setCurrentNode(node);
    setCurrentNode(node);
    navigate('/app/upload');
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleLogout = () => {
    storage.setCurrentNode(null);
    storage.setAuthToken(null);
    setCurrentNode(null);
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onGetStarted={handleGetStarted} />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} onBack={handleBackToLanding} />} />
      <Route
        path="/app"
        element={
          currentNode ? (
            <Layout currentNode={currentNode} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="upload" replace />} />
        <Route path="upload" element={currentNode ? <UploadPage currentNode={currentNode} /> : <Navigate to="/login" replace />} />
        <Route path="check-integrity" element={<FileValidityPage />} />
        <Route path="download" element={<DownloadPage />} />
        <Route path="visualizer" element={<VisualizerPage />} />
        <Route path="global-map" element={<GlobalMapPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
