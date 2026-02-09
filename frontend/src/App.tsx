import { useState } from 'react'
import './App.css'
import PhoneFrame from './components/PhoneFrame'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#EAE68E] h-full min-w-screen">
      <PhoneFrame>
        <div className="p-4 h-full flex flex-col">
          <div className="flex gap-4 items-center justify-center">
            <h1 className="text-xl font-bold text-cyan-600">Vite + React</h1>
          </div>
          <div className="grow flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-cyan-400">Tailwind works 🚀</h2>
            <button
              className="mt-6 px-4 py-2 bg-cyan-500 text-white rounded"
              onClick={() => setCount((c) => c + 1)}
            >
              count is {count}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">Edit src/App.tsx and save to test HMR</p>
        </div>
      </PhoneFrame>
    </div>
  )
}

export default App
