import { useState, useRef, useEffect } from 'react'
import './App.css'
import PhoneFrame from './components/PhoneFrame'
import { Button } from "./components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import MessageArea from './components/messageArea'

type Message = {
  id?: string | number
  text?: string
  sender: string
  loading?: boolean
}

function App() {
  const [answer, setAnswer] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! Welcome to the personality test. Please answer the following question to get started! Say 'start' to begin.", sender: "bot" },
  ])

  const questions = [
    "What's your name?",
    "How do you like to start your day? Do you go running, make breakfast, doomscroll in bed...?",
    "What do you fear more, being late or tall heights?",
    "What's your favorite color?",
    "Do you have a favorite animal? Any pets? What are their names?",
    "If you are given the choice between sushi, tacos, pizza, or a burger for your last meal, which would you pick?",
    "If you were a pokemon type which would you be?",
    "In what order do you put on your toothpaste? Water then toothpaste, or toothpaste then water?",
    "Gay son or thot daughter?",
    "Which Asian country is your favorite and why is it China?",
    "Who is more attractive, a man who can explain the difference between a catapult and a trebuchet, or a man who can't?"
  ]

  // (instructions array removed — testing mode uses template replies directly)

  // Reply builder — creates a contextual reply from the user's actual answer.
  // Multiple variants per question for variety on replays.
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const buildReply = (qIdx: number, userText: string): string => {
    const a = userText.trim()
    const aLower = a.toLowerCase()
    switch (qIdx) {
      case 0: return pick([
        `hey ${a}!! that's such a cool name 😊`,
        `${a}!! love that name fr`,
        `omg hi ${a}!! welcome 🥰`,
        `${a} is a vibe, I love it`,
      ])
      case 1: return pick([
        `ooo nice, ${a} is a solid way to start the day tbh`,
        `wait really?? that's actually goals ngl`,
        `honestly ${a} sounds so cozy, I need to try that`,
        `love that for you, ${a} is elite morning energy`,
      ])
      case 2: {
        const isLate = aLower.includes('late')
        return isLate ? pick([
          `omg same, being late gives me so much anxiety 😭`,
          `being late is the WORST I literally can't function 😩`,
          `ok being late is scarier than heights and I will die on this hill`,
        ]) : pick([
          `heights are terrifying fr, like why would I go up there 😭`,
          `nah heights are no joke, I get dizzy just looking down 💀`,
          `omg same, I avoid tall things at ALL costs`,
        ])
      }
      case 3: return pick([
        `${a}?? interesting... I kinda pictured you as more of a purple person ngl 😂`,
        `ooo ${a} is a solid color choice, you have taste`,
        `wait really ${a}?? I can totally see that actually`,
        `${a} is underrated honestly, good pick 🎨`,
      ])
      case 4: return pick([
        `awww thats so cute!! love that 🥺`,
        `WAIT that is adorable, I can't handle it 😭`,
        `omg stop that's the cutest thing I've heard today`,
        `I love that so much, 10/10 answer 🥺`,
      ])
      case 5: {
        const food = aLower.includes('sushi') ? 'sushi' :
                     aLower.includes('taco') ? 'tacos' :
                     aLower.includes('pizza') ? 'pizza' :
                     aLower.includes('burger') ? 'burgers' : a
        return pick([
          `oooo yummers!! ${food} is a solid pick fr`,
          `${food}?? ELITE taste honestly, I approve 🤤`,
          `ok ${food} as a last meal is genuinely genius`,
          `you picked ${food}?? we would get along so well tbh`,
        ])
      }
      case 6: return pick([
        `${a}?? thats a good one tbh, solid choice`,
        `ooo ${a} type is so cool, I respect that`,
        `${a}!! I honestly could see that for you`,
        `wait ${a} type is lowkey overpowered tho 👀`,
      ])
      case 7: {
        const waterFirst = aLower.includes('water') && aLower.indexOf('water') < aLower.indexOf('tooth')
        return waterFirst ? pick([
          `THANK YOU omg you are correct and there is no debate`,
          `water first gang!! this is the only right answer 💯`,
          `exactly, water first is scientifically superior and I will not hear otherwise`,
        ]) : pick([
          `toothpaste first?? ok you're brave and also wrong but I respect the chaos 😂`,
          `we can still be friends but just know... you are incorrect 😤`,
          `the audacity... toothpaste first... I'm shaking my head rn`,
        ])
      }
      case 8: return pick([
        `hmm interesting choice... I respect that tho 🤔`,
        `honestly both options are wild but I respect your honesty 😂`,
        `ok this question is a trap but you handled it well`,
        `lmaooo that's a bold answer, I respect the confidence`,
      ])
      case 9: return pick([
        `of course, who doesn't love it there honestly 🤷`,
        `honestly so valid, the food alone makes it S tier`,
        `the culture is incredible tbh, great answer`,
        `you have excellent taste, just saying 🤌`,
      ])
      case 10: {
        const catapult = aLower.includes('can\'t') || aLower.includes('cant') || aLower.includes('second')
        return catapult ? pick([
          `the mystery is attractive I guess... but the first type is superior and I stand by that`,
          `hmm ok ignorance is bliss I guess 😂 but the trebuchet guy is objectectively better`,
          `bold choice... the first type is still superior but I respect your vibe`,
        ]) : pick([
          `CORRECT the trebuchet knowledge man is superior in every way 🏆`,
          `YES finally someone gets it, a man who knows siege weapons is just built different`,
          `absolutely, that man is a 10/10 no debate allowed`,
        ])
      }
      default: return pick([
        `haha nice answer tbh 😄`,
        `love that response honestly`,
        `ok I vibe with that answer fr`,
      ])
    }
  }

  const [testing, setTesting] = useState(false)
  const testingRef = useRef<boolean>(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1)
  const currentQuestionIndexRef = useRef<number>(-1)
  const [completed, setCompleted] = useState(false)

  useEffect(() => { testingRef.current = testing }, [testing])
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex }, [currentQuestionIndex])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)

  const cleanReplyText = (s: string | null | undefined): string | null => {
    if (!s) return null
    let out = String(s).replace(/\r\n/g, '\n').trim()
    out = out
      .split('\n')
      .map((line) => line.replace(/^\s*User\s*\d+\s*:\s*/i, '').trim())
      .filter(Boolean)
      .join('\n')
    return out || null
  }

  const extractText = (obj: any): string | null => {
    if (!obj) return null
    if (typeof obj.message?.content === 'string') return cleanReplyText(obj.message.content)
    if (typeof obj.message?.content?.text === 'string') return cleanReplyText(obj.message.content.text)
    if (Array.isArray(obj.output) && obj.output[0]?.content?.[0]?.text) return cleanReplyText(obj.output[0].content[0].text)
    if (obj.result?.choices?.[0]?.message?.content) return cleanReplyText(obj.result.choices[0].message.content)
    if (obj.choices?.[0]?.message?.content?.[0]?.text) return cleanReplyText(obj.choices[0].message.content[0].text)
    const walk = (o: any): string | null => {
      if (typeof o === 'string') return o
      if (Array.isArray(o)) {
        for (const v of o) { const t = walk(v); if (t) return t }
      } else if (o && typeof o === 'object') {
        for (const k of Object.keys(o)) { const t = walk(o[k]); if (t) return t }
      }
      return null
    }
    return cleanReplyText(walk(obj))
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return
    const lower = answer.trim().toLowerCase()

    // start test shortcut
    if (lower === 'start' && !testingRef.current) {
      setTesting(true)
      setCurrentQuestionIndex(0)
      setMessages((prev) => [...prev, { id: 'q-0', text: questions[0], sender: 'bot' }])
      setAnswer("")
      return
    }

    // play sound when sending (user gesture)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      void audioRef.current.play().catch(() => {})
    }

    const userMessage = { id: Date.now() + Math.random(), text: answer, sender: 'user' }
    const loadingBotMessage = { id: 'bot-' + Date.now() + Math.random(), sender: 'bot', loading: true }

    setMessages((prev) => [...prev, userMessage, loadingBotMessage])
    setAnswer("")

    try {
      // ─── TESTING MODE: use template replies (model is unreliable) ───
      if (testingRef.current) {
        const qIdx = currentQuestionIndexRef.current
        const userText = String(userMessage.text || '')

        // Add a small random delay (300-800ms) so it feels like typing
        await new Promise(r => setTimeout(r, 300 + Math.random() * 500))

        const reply = buildReply(qIdx, userText)

        // Show the bot reply
        setMessages((prev) => prev.map(m =>
          m.id === loadingBotMessage.id ? { ...m, loading: false, text: reply } : m
        ))

        // Frontend controls flow: always advance to next question
        const isLastQuestion = qIdx >= questions.length - 1
        if (isLastQuestion) {
          setTesting(false)
          setCompleted(true)
          setMessages((prev) => [...prev, {
            id: 'done',
            text: "That's all the questions! The personality test is complete. Tap 'See Results' below 🎉",
            sender: 'bot'
          }])
        } else {
          const nextIdx = qIdx + 1
          setCurrentQuestionIndex(nextIdx)
          setMessages((prev) => [...prev, {
            id: `q-${nextIdx}`,
            text: questions[nextIdx],
            sender: 'bot'
          }])
        }

        // play sound for bot reply
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          void audioRef.current.play().catch(() => {})
        }
        return
      }

      // ─── NORMAL (non-testing) MODE: free chat ───
      // Filter to only real text messages (skip question prompts, loading placeholders, system)
      const chatMessages = [...messages, userMessage].filter((m: any) => m.text && !m.loading)
      const recent = chatMessages.slice(-20)
      const apiMessages = recent.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text || ''
      }))

      const requestBody = { model: 'ryan-mistral-gpu', messages: apiMessages, stream: false }
      console.debug('OLLAMA request', requestBody)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Model API error: ${res.status} ${txt}`)
      }

      const data = await res.json()
      console.debug('OLLAMA response raw', data)

      let reply = extractText(data) || 'Sorry, no reply from model.'
      reply = reply.replace(/^\s*(?:Ryan|Assistant|Bot)\s*:\s*/gim, '').trim()

      setMessages((prev) => prev.map(m =>
        m.id === loadingBotMessage.id ? { ...m, loading: false, text: reply } : m
      ))

      if (audioRef.current) {
        audioRef.current.currentTime = 0
        void audioRef.current.play().catch(() => {})
      }
    } catch (err: any) {
      const message = err?.message || 'Error contacting model.'
      setMessages((prev) => prev.map(m =>
        m.id === loadingBotMessage.id ? { ...m, loading: false, text: message } : m
      ))
    }
  }

  const showResults = () => {
    const userAnswers = messages.filter(m => m.sender === 'user').map(m => m.text || '')
    const summary = questions.map((q, i) => `Q${i+1}: ${q}\nA: ${userAnswers[i] || '(no answer)'}\n`).join('\n')
    alert(`Personality test results:\n\n${summary}`)
  }

  useEffect(() => {
    audioRef.current = new Audio('/sounds/yoshi-tongue.mp3')
    audioRef.current.load()
    if (messagesScrollRef.current) {
      const el = messagesScrollRef.current
      const target = Math.floor(el.scrollHeight * 0.25)
      el.scrollTop = target
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    const rafId = requestAnimationFrame(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      } catch {
        el.scrollTop = el.scrollHeight
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [messages])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#eceabe] h-full min-w-screen">
      <div className="absolute w-full h-full overflow-hidden">
        <img src="/images/cloud.webp" alt="cloud" className="absolute top-0 left-120 object-cover pointer-events-none select-none opacity-20" />
        <img src="/images/cloud.webp" alt="cloud" className="absolute top-160 left-210 object-cover pointer-events-none select-none opacity-20" />
        <img src="/images/cloud.webp" alt="cloud" className="absolute top-80 left-350 object-cover pointer-events-none select-none opacity-20" />
        <img src="/images/cloud.webp" alt="cloud" className="absolute top-130 -left-20 object-cover pointer-events-none select-none opacity-20" />
      </div>
      <PhoneFrame>
        <div className="p-4 h-full flex flex-col relative">
          <div className="flex gap-4 items-center justify-center"></div>
          <div className="flex-1 min-h-0 flex flex-col relative px-2 pt-0 pb-1 space-y-2 w-full no-scrollbar">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
              <div className="flex flex-col items-center">
                <img src="/images/snoopy.svg" alt="snoopy" className="w-48 pointer-events-none mb-2 select-none" />
                <h1 className="bg-transparent px-2 py-1 text-center text-lg font-bold text-cyan-400 whitespace-nowrap pointer-events-none">Personality Test</h1>
              </div>
            </div>

            <div ref={messagesScrollRef} className="flex-1 min-h-0 flex flex-col relative overflow-y-auto pt-0 pb-1 space-y-2 w-full no-scrollbar">
              <div className="w-full flex flex-col gap-2">
                {messages.length <= 7 && (<div style={{ height: '16vh', minHeight: 120 }} />)}
                {messages.map((message, index) => (<MessageArea key={index} message={message} />))}
              </div>
            </div>

            {completed && (
              <div className="mb-2 flex justify-center">
                <Button onClick={showResults}>See Results</Button>
              </div>
            )}

            <div className="h-16 -mx-4 -mb-4 bg-[#a7fff9] flex items-center justify-center border-[#5a5a5a] border-t-2 px-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}

export default App
