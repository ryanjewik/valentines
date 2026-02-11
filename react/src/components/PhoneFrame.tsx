import React from 'react'

type Props = {
  children?: React.ReactNode
}

const PhoneFrame: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="relative w-80 sm:w-96 md:w-[360px] h-[720px] bg-[#ffa7e2] rounded-3xl shadow-2xl flex items-center justify-center border-4 border-[#5e5e5e]">
        <div className="absolute left-0 top-1/3 w-1 h-12 bg-gray-700 rounded-r-md -ml-1" />
        <div className="absolute right-0 top-1/3 w-1 h-12 bg-gray-700 rounded-l-md -mr-1" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-2 bg-gray-700 rounded-full" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gray-700 rounded-full" />

        <div className="w-[92%] h-[92%] bg-white rounded-2xl overflow-hidden">
          {children ?? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <h1 className="text-2xl font-semibold text-gray-900">Mobile App</h1>
              <p className="text-sm text-gray-600 mt-2">Your content goes here</p>
              <div className="mt-6 w-full flex-1 bg-slate-100 rounded-md flex items-center justify-center">
                <span className="text-gray-400">Screen area</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhoneFrame
