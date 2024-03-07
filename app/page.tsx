'use client';
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import Typewriter from "./components/Typewriter"
import Image from "next/image";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";

const llmModels = [
  {
    id: 0,
    model: 'llama2-70b-4096',
  },
  {
    id: 1,
    model: "mixtral-8x7b-32768"
  }
]

export default function Home() {
  const windowRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      value: ""
    },
    {
      type: "user",
      value: ""
    }
  ] as any[]);
  const [prompt, setPrompt] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [model, setModel] = useState("mixtral-8x7b-32768"); // default model

  const sendMessage = async () => {
    setLoading(true);
    const newMessage = { // add prompt to messages
      type: "user",
      value: prompt
    };
    setMessages(prevMessages => [...prevMessages, newMessage]); // set messages in state
    setPrompt(""); // clear the users prompt
    const reqBody = {
      message: prompt,
      model: model
    }
    try {
      const response = await fetch('/api/groq', { // send request to qroq api
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody)
      });
      const data = await response.json();
      // set assistant message in state
      const newMessage = {
        type: "assistant",
        value: data.output
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setLoading(false);
    } catch (error) {
      console.error('Error');
      alert('Error!' + error)
    }
  };

  // hide modelRef if user clicks outside model-modal
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModel(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    }
  }, [modelRef]);

  return (
    <main className="flex flex-col items-center justify-between w-full">
      <div className="absolute right-0 m-2 opacity-30 hover:opacity-90 cursor-pointer transition-all duration-700 bg-white p-1 rounded-full flex gap-1 text-xs pr-2 items-center">
        <Image src="/github-icon.svg" alt="Groquet" width={16} height={16} className="" />
        Github

      </div>

      <div
      onClick={() => setShowModel(!showModel)}
      className="absolute left-2 flex text-sm gap-2 m-2 px-2 cursor-pointer opacity-50 hover:opacity-90">
        <RocketLaunchIcon className="h-5 w-5" />
        <p className="text-center">
          {model}
        </p>
      </div>

      <div
      ref={modelRef}
      className={`
      ${showModel ? "absolute" : "hidden"}
       left-8 top-8 bg-white border h-auto p-2 rounded-xl shadow transition-all cursor-pointer`}>
        {llmModels.map((llm) => (
          <div
          onClick={() => {setModel(llm.model); setShowModel(false)}}
          key={llm.id} className="flex gap-2 items-center opacity-50 hover:opacity-90">
            {llm.model}
          </div>
        ))}
      </div>

      <div
        ref={windowRef}
        className="flex-1 overflow-auto flex flex-col gap-4 w-full min-h-screen justify-end">
        {messages.map((item, index) => item.value !== "" &&
          <div key={index} className={`mx-6 shadow border items-start rounded-2xl md:items-center max-w-md ${item.type === "user" ? "text-right self-end bg-green-100" : "bg-white"}`}>

            <Typewriter
              fontSize={16}
              delay={0}
              infinite={false}
              text={item.value}
            />
          </div>)}
        <div className="p-2 flex items-center gap-4 w-full bg-gray-100">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
            className="flex bg-white w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1 min-h-[60px]"
            placeholder="Ask me a question."
          />
          <button
            disabled={loading}
            onClick={() => sendMessage()}
            className="rounded-lg bg-black p-4 text-white">
            {loading ? <ArrowPathIcon className="h-6 w-6 animate-spin" aria-hidden="true" />
              : "Send"}
          </button>
        </div>
      </div>

    </main>
  );
}
