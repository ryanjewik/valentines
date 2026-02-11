import React from 'react'

type Message = {
    id?: string | number
    text?: string
    sender: string
    loading?: boolean
}

type Props = {
    message: Message
}

const MessageArea: React.FC<Props> = ({ message }) => {
    const isUser = message.sender === 'user'

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`text-[#646464] rounded-lg p-3 mb-2 max-w-[80%] text-left break-words ${isUser ? 'bg-[#a7fff9] self-end' : 'bg-[#f4ec9f] self-start'}`}>
                {message.loading ? (
                    <div className="flex items-center gap-2">
                        <img src="/images/cat.webp" alt="loading" className="w-10 h-10 rounded-md animate-pulse" />
                        <span>Thinking…</span>
                    </div>
                ) : (
                    <>{message.text}</>
                )}
            </div>
        </div>
    )
}

export default MessageArea