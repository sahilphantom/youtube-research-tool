import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import VideoAnalysis from './components/VideoAnalysis'
import ChannelAnalysis from './components/ChannelAnalysis'
import VideoSearch from './components/VideoSearch'
import Home from './components/Home'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video-analysis" element={<VideoAnalysis />} />
          <Route path="/channel-analysis" element={<ChannelAnalysis />} />
          <Route path="/video-search" element={<VideoSearch />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 