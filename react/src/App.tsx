import { useState, useRef, useEffect } from 'react'
import './App.css'
import PhoneFrame from './components/PhoneFrame'
import { Button } from "./components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import MessageArea from './components/messageArea'

type Message = {
  id?: string | number
  text?: string
  image?: string
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

  // Dynamic instruction builder — evaluates conditionals in JS so the model
  // only gets a simple, direct instruction (no if/else for a 7B to fumble)
  const getInstruction = (qIdx: number, userText: string): string => {
    const lower = userText.trim().toLowerCase()
    switch (qIdx) {
      case 0:
        return lower.includes('savana')
          ? `Say "savana?? that's literally the cutest name ever" and be a little flirty. Example: "omg savana?? that's literally the cutest name ever 🥰😍"`
          : `Say hi, repeat her name "${userText.trim()}", and say it's a nice name. Example: "hey ${userText.trim()}!! that's such a cool name 😊✨"`
      case 1:
        return `Comment positively on how they start their day with "${userText.trim()}". Example: "${userText.trim()}?? honestly same that's elite morning energy 😂🙌"`
      case 2:
        return lower.includes('late')
          ? `Say "somehow I knew that..." and joke about being late. Example: "somehow I knew that... 😭💀 being late is literally my worst nightmare too"`
          : lower.includes('height') || lower.includes('tall')
          ? `Say you totally relate to fearing heights. Example: "omg heights are terrifying fr like why would anyone go up there 😭🫣"`
          : `React to their fear and say something relatable. Example: "honestly both are scary I feel you on that 😂😭"`
      case 3:
        return lower.includes('purple')
          ? `Say "great minds think alike" because purple is your favorite too. Example: "purple?? great minds think alike that's my fav too 😍💜"`
          : `Joke that you totally pictured her as a PURPLE person. You MUST mention purple. Example: "wait not purple?? I totally had you pegged as a PURPLE person 😂💜"`
      case 4:
        return lower.includes('panko')
          ? `Say you've heard SO many good things about panko. You MUST mention panko by name. Example: "omg panko?? I've heard so many good things about him 🥺💕 what a cutie"`
          : `React warmly to their pet answer and compliment their pet names. Example: "awww that's so cute I can't handle it 🥺💕"`
      case 5: {
        const food = lower.includes('sushi') ? 'sushi' : lower.includes('taco') ? 'tacos' : lower.includes('pizza') ? 'pizza' : lower.includes('burger') ? 'burgers' : userText.trim()
        return `Say "yummers" and praise their choice of ${food}. Example: "yummers!! ${food} is literally the best last meal choice 🤤😋"`
      }
      case 6:
        return `Say they seem like a morpeko type of girl and react to their choice. Example: "ooo I could totally see that but lowkey you give morpeko vibes 😂⚡"`
      case 7:
        return (lower.includes('water') && lower.indexOf('water') < (lower.indexOf('tooth') === -1 ? Infinity : lower.indexOf('tooth')))
          ? `Say "how does anybody do the other way?!" because water first is correct. Example: "EXACTLY how does anybody do the other way?!?! 😤🙌 water first gang"`
          : `Say "the audacity" and "I can still be friends with you but just know... you are incorrect". Example: "the AUDACITY 😤 I can still be friends with you but just know... you are incorrect 😂"`
      case 8:
        return `Playfully question their choice then say "what's wrong with the other???". Example: "wait really?? I respect it but like... what's wrong with the other??? 😂🤔"`
      case 9:
        return lower.includes('taiwan')
          ? `Say "oops haha" about Taiwan in a playful way. Example: "oops haha 😅🫣 I mean... great choice tho"`
          : lower.includes('china')
          ? `Say "CHINA NUMBA 1!!!" enthusiastically. Example: "CHINA NUMBA 1!!! 🇨🇳🔥 let's gooo"`
          : `React positively and say you love that place too. Example: "ooo great choice I love that place too 🔥🌏"`
      case 10:
        return (lower.includes("can't") || lower.includes('cant') || lower.includes('second'))
          ? `Say they're wrong and the first man (who knows about trebuchets) is superior. Example: "nah you're wrong the trebuchet man is SUPERIOR 🏆💪 knowledge is power"`
          : `Say the trebuchet man is superior and trebuchets are objectively better. Example: "CORRECT the trebuchet man is SUPERIOR 🏆💪 trebuchets are objectively better in every way"`
      default:
        return `React casually and positively. Example: "haha nice answer tbh 😄✨"`
    }
  }

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
        const isHeight = aLower.includes('height') || aLower.includes('tall')
        return isLate ? pick([
          `omg same, being late gives me so much anxiety 😭`,
          `being late is the WORST I literally can't function 😩`,
          `ok being late is scarier than heights and I will die on this hill`,
        ]) : isHeight ? pick([
          `heights are terrifying fr, like why would I go up there 😭`,
          `nah heights are no joke, I get dizzy just looking down 💀`,
          `omg same, I avoid tall things at ALL costs`,
        ]) : pick([
          `lol fair both are pretty scary tbh 😂`,
          `honestly valid, they're both terrifying in different ways`,
          `ok mood, I'd probably say both too ngl`,
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
  const [popup, setPopup] = useState<'none' | 'results' | 'valentines'>('none')
  const [showHearts, setShowHearts] = useState(false)
  const [hearts, setHearts] = useState<{id: number, left: number, delay: number, size: number, emoji: string}[]>([])

  useEffect(() => { testingRef.current = testing }, [testing])
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex }, [currentQuestionIndex])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const renaiRef = useRef<HTMLAudioElement | null>(null)
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

    // start test — only exact keywords, not greetings
    if (!testingRef.current && /^(start|begin)!*$/i.test(lower)) {
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
      // ─── TESTING MODE: model response with fallback safety net ───
      if (testingRef.current) {
        const qIdx = currentQuestionIndexRef.current
        const userText = String(userMessage.text || '')
        const instruction = getInstruction(qIdx, userText)
        const question = questions[qIdx] || ''
        const fallback = buildReply(qIdx, userText)

        const systemPrompt = `You are Ryan, a fun guy texting a friend during a personality test. You MUST use at least 2-3 emojis in every reply. Keep replies to 1-2 short casual sentences. Text like a gen-z person. Never use brackets, labels, or tags.`

        const userPrompt = [
          `Question: "${question}"`,
          `Her answer: "${userText}"`,
          ``,
          `IMPORTANT - You MUST follow this instruction exactly:`,
          `${instruction}`,
          ``,
          `Use 2-3 emojis. Keep it to 1-2 sentences. If her answer is vague, tease her and pick for her.`,
        ].join('\n')

        let reply = fallback // default to fallback if anything goes wrong

        try {
          const requestBody = {
            model: 'ryan-mistral-gpu',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            stream: false,
            options: {
              temperature: 0.55,
              top_p: 0.75,
              num_predict: 60,
              repeat_penalty: 1.25,
              top_k: 40,
            },
          }
          console.debug('OLLAMA request (testing)', requestBody)

          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          })

          if (res.ok) {
            const data = await res.json()
            console.debug('OLLAMA response raw (testing)', data)

            let modelReply = extractText(data) || ''
            modelReply = modelReply
              .replace(/^\s*(?:Ryan|Assistant|Bot|User)\s*:\s*/gim, '')
              .replace(/\[[^\]]{0,30}\]/g, '')
              .replace(/replied as\s*:?\s*/gi, '')
              .replace(/answer\s*:\s*/gi, '')
              .replace(/^\.\s*/gm, '')
              .replace(/\b\w+\.(?:com|org|net|io|co|me)\b/gi, '')
              .replace(/^"+|"+$/g, '')
              .replace(/^'+|'+$/g, '')
              .trim()

            // Take only first 1-2 sentences
            const sentences = modelReply.match(/[^.!?]+[.!?]*/g)
            if (sentences && sentences.length > 2) {
              modelReply = sentences.slice(0, 2).join('').trim()
            }

            // Quick junk check — catch SMS artifacts and inappropriate content
            const junk = /personal information|\bverb\b.*\bnoun\b|📱📱|verification code|\bwikimedia\b|\bmember since\b|\bbikini\b|\bsexy\b|\bnaked\b|\bundress/i.test(modelReply)

            if (modelReply && modelReply.length >= 3 && !junk) {
              reply = modelReply
            } else {
              console.warn('Model reply junky, using fallback:', modelReply)
            }
          }
        } catch (e) {
          console.warn('Model call failed, using fallback:', e)
        }

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
      // Filter out quiz prompts, welcome messages, and loading placeholders
      const chatMessages = [...messages, userMessage].filter((m: any) => {
        if (!m.text || m.loading) return false
        if (typeof m.id === 'string' && (m.id.startsWith('q-') || m.id === 'done')) return false
        if (/personality test|say.*start/i.test(m.text || '')) return false
        return true
      })
      const recent = chatMessages.slice(-20)
      const apiMessages = [
        { role: 'system', content: 'You are Ryan, a chill guy texting casually with a friend. Keep replies short and natural. Use slang and emojis sometimes.' },
        ...recent.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text || ''
        }))
      ]

      const requestBody = {
        model: 'ryan-mistral-gpu',
        messages: apiMessages,
        stream: false,
        options: {
          temperature: 0.6,
          top_p: 0.8,
          num_predict: 60,
          repeat_penalty: 1.2,
          top_k: 50,
        },
      }
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
      reply = reply
        .replace(/^\s*(?:Ryan|Assistant|Bot|User)\s*:\s*/gim, '')
        .replace(/\[[^\]]{0,30}\]/g, '')
        .replace(/\b\w+\.(?:com|org|net|io|co|me)\b/gi, '')
        .trim()

      // Truncate to first 2-3 sentences
      const sentences = reply.match(/[^.!?]+[.!?]*/g)
      if (sentences && sentences.length > 3) {
        reply = sentences.slice(0, 3).join('').trim()
      }

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
    setPopup('results')
  }

  useEffect(() => {
    audioRef.current = new Audio('/sounds/yoshi-tongue.mp3')
    audioRef.current.load()
    renaiRef.current = new Audio('/sounds/renai.mp4')
    renaiRef.current.loop = true
    renaiRef.current.load()
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

            {/* Results popup */}
            {popup === 'results' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPopup('none')}>
                <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                  <img src="/images/results.png" alt="Results" className="max-w-[90vw] max-h-[75vh] rounded-2xl shadow-2xl object-contain" />
                  <Button
                    className="mt-4 px-8 py-3 text-lg bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg"
                    onClick={() => setPopup('valentines')}
                  >
                    Next ➡️
                  </Button>
                </div>
              </div>
            )}

            {/* Valentines popup */}
            {popup === 'valentines' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPopup('none')}>
                <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                  <img src="/images/valentines.png" alt="Will you be my Valentine?" className="max-w-[90vw] max-h-[70vh] rounded-2xl shadow-2xl object-contain" />
                  <div className="mt-4 flex gap-4">
                    <Button
                      className="px-8 py-3 text-lg bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg"
                      onClick={() => {
                        setPopup('none')
                        setMessages((prev) => [
                          ...prev,
                          { text: "She said YES!! 🎉💕", sender: 'bot' },
                          { image: '/images/snoopy.gif', sender: 'bot' },
                        ])
                        // Play renai music on loop
                        if (renaiRef.current) {
                          renaiRef.current.currentTime = 0
                          void renaiRef.current.play().catch(() => {})
                        }
                        // Start infinite hearts
                        setShowHearts(true)
                        const spawnHearts = () => {
                          const heartEmojis = ['💕', '❤️', '💖', '💗', '💓', '🩷', '💞', '💘', '💝', '🥰']
                          setHearts(Array.from({ length: 30 }, (_, i) => ({
                            id: Date.now() + i,
                            left: Math.random() * 100,
                            delay: Math.random() * 3,
                            size: 16 + Math.random() * 32,
                            emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)]
                          })))
                        }
                        spawnHearts()
                        const heartInterval = setInterval(spawnHearts, 3500)
                        // Store interval so it runs forever (no cleanup needed - runs until page close)
                        ;(window as any).__heartInterval = heartInterval
                      }}
                    >
                      Yes 💕
                    </Button>
                    <Button
                      className="px-8 py-3 text-lg bg-red-400 hover:bg-red-500 text-white rounded-full shadow-lg"
                      onClick={() => {
                        alert('Try again 😊')
                      }}
                    >
                      No 😢
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Falling hearts overlay */}
            {showHearts && (
              <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
                {hearts.map((h) => (
                  <span
                    key={h.id}
                    className="absolute animate-fall"
                    style={{
                      left: `${h.left}%`,
                      top: '-10%',
                      fontSize: `${h.size}px`,
                      animationDelay: `${h.delay}s`,
                      animationDuration: `${2.5 + Math.random() * 2}s`,
                    }}
                  >
                    {h.emoji}
                  </span>
                ))}
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
