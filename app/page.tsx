'use client';
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { useRef, useState } from "react";

export default function Home() {
  const windowRef = useRef<HTMLDivElement>(null);
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


  const sendMessage = async () => {
    setLoading(true);
    // add prompt to messages
    const newMessage = {
      type: "user",
      value: prompt
    };
    // set messages in state
    setMessages(prevMessages => [...prevMessages, newMessage]);
    const reqBody = {
      message: prompt,
    }
    // send request to qroq api
    try {
      const response = await fetch('/api/groq', {
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
      // Handle the error in the UI, perhaps set an error state
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between w-full">
      <div
        ref={windowRef}
        className="flex-1 overflow-auto  flex flex-col gap-4 w-full h-svh pb-24">
        {messages.map((item, index) =>
          <div key={index} className={`mx-6 shadow border items-start rounded-2xl md:items-center max-w-md ${item.type === "user" ? "text-right self-end bg-green-100" : "bg-white"}`}>
            {item.value &&
              <div className="p-2 text-md">{item.value}
              </div>}
          </div>)}
          <div className="p-2 flex items-center gap-4 w-full bg-gray-100 fixed bottom-0 z-50">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex bg-white w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1 min-h-[60px]"
          placeholder="Type a message."
        ></textarea>
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
