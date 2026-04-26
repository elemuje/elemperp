import { Routes, Route } from 'react-router-dom'
import { WalletProvider } from '@/contexts/WalletContext'
import { TradingProvider } from '@/contexts/TradingContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { Navbar } from '@/components/Navbar'
import { NetworkModal } from '@/components/NetworkModal'
import { ArciumExecutionPanel } from '@/components/ArciumExecutionPanel'
import { MarketTicker } from '@/components/MarketTicker'
import { HomePage } from '@/pages/Home'
import { TradePage } from '@/pages/Trade'
import { LeaderboardPage } from '@/pages/Leaderboard'
import { PrivacyPage } from '@/pages/Privacy'
import { DocsPage } from '@/pages/Docs'

export default function App() {
  return (
    <ToastProvider>
      <WalletProvider>
        <TradingProvider>
          <div className="min-h-screen bg-[#0a0e1a] text-white">
            <Navbar />
            <MarketTicker />
            <NetworkModal />
            <ArciumExecutionPanel />
            {/* pt-14 navbar + pt-8 ticker = pt-22 total */}
            <div className="pt-8">
              <Routes>
                <Route path="/"                     element={<HomePage />} />
                <Route path="/trade"                element={<TradePage />} />
                <Route path="/leaderboard"          element={<LeaderboardPage />} />
                <Route path="/privacy"              element={<PrivacyPage />} />
                <Route path="/privacy-architecture" element={<PrivacyPage />} />
                <Route path="/docs"                 element={<DocsPage />} />
              </Routes>
            </div>
          </div>
        </TradingProvider>
      </WalletProvider>
    </ToastProvider>
  )
}
