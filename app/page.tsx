'use client';
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { use, useEffect, useRef, useState } from "react";
import Typewriter from "./components/Typewriter"
import Image from "next/image";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { MicrophoneIcon } from "@heroicons/react/16/solid";
import { CloudArrowDownIcon } from "@heroicons/react/24/solid";

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

interface Window {
  webkitSpeechRecognition: any;
}


export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  const [reply, setReply] = useState("");
  const [recognition, setRecognition] = useState(null as any);
  const [isListening, setIsListening] = useState(false);
  const [audio, setAudio] = useState(null as any);

  const getAudioData = async (message: any) => {
    try {
      const reqBody = { message };
      const response = await fetch('/api/googletts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });
      const data = await response.json();
      // Ensure proper data URI format for audio
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      console.log("Playing audio"); // Debugging log
      audio.play();
    } catch (error) {
      console.error('Error:', error);
      alert('Error!' + error);
    }
};

  const sendMessage = async (recordedText: any) => {
    setLoading(true);
    const newMessage = { // add prompt to messages
      type: "user",
      value: recordedText
    };
    setMessages(prevMessages => [...prevMessages, newMessage]); // set messages in state
    setPrompt(""); // clear the users prompt
    const reqBody = {
      message: recordedText,
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
      if (data.output !== "") {
        setReply(data.output);
      }
      if (isListening) {
        getAudioData(data.output);
      }

      setMessages(prevMessages => [...prevMessages, newMessage]);
      setLoading(false);
    } catch (error) {
      console.error('Error');
      alert('Error!' + error)
    }
  };
  

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


// stop all audio on click
  const handleClick = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }

  
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as Window).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const recordedText = event.results[i][0].transcript;
            handleClick();
            setPrompt(recordedText);
            sendMessage(recordedText);
          }
        }
      };
      setRecognition(recognition);
    } else {
      alert('Speech recognition not available');
    }
  }, []);

  const startListening = () => {
    setReply("Hello! I'm Groqet, start speaking to ask me a question.")
    setIsListening(true);
    if (recognition) {
      recognition.start();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognition) {
      recognition.stop();
    }
  };

  // download all messages as a text file
  const downloadMessages = () => {
    const messagesText = messages.map((message) => `${message.type}: ${message.value}`).join('\n');
    const blob = new Blob([messagesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groqet-messages.txt';
    a.click();
  };

  useEffect(() => {
    if (reply !== "" && isListening) {
      getAudioData(reply);
    }
  }, [reply]);
  
  useEffect(() => {
    if (windowRef.current) {
      const scrollHeight = windowRef.current.scrollHeight;
      windowRef.current.scrollTop = scrollHeight
    }
  }, [messages, windowRef]);

  return (<div>
    {Header()}
    <main className="flex flex-col items-center justify-between w-full h-svh">
      <div
        ref={windowRef}
        className="flex-1 overflow-auto flex flex-col gap-4 w-full h-svh py-12"
      >
        {messages.map((item, index) => item.value !== "" &&
          <div 
          onClick={() => handleClick()}
          key={index} className={`mx-6 shadow border items-start rounded-2xl md:items-center max-w-5xl ${item.type === "user" ? "text-right self-end bg-green-100 ml-24" : "bg-white mr-24"}`}>
            <Typewriter
              fontSize={16}
              delay={0}
              infinite={false}
              text={item.value}
            />
          </div>)}
      </div>
      <div className="p-2 flex items-center gap-4 w-full bg-gray-100">
        <CloudArrowDownIcon
        onClick={downloadMessages}
        className="h-6 w-6 text-gray-500" />
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendMessage(prompt);
            }
          }}
          className="flex bg-white w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
          placeholder="Ask me a question."
        />
        <button
          disabled={loading}
          onClick={() => sendMessage(prompt)}
          className="rounded-lg bg-black p-2 text-white">
          {loading ? <ArrowPathIcon className="h-6 w-6 animate-spin" aria-hidden="true" />
            : "Send"}
        </button>
      {!isListening ?  <MicrophoneIcon
      onClick={startListening}
      className="h-6 w-6 text-gray-500 cursor-pointer" /> : <MicrophoneIcon
      onClick={stopListening}
      className="h-6 w-6 text-red-500 animate-pulse cursor-pointer" />}
      </div>
    </main>
  </div>
  );

  function Header() {
    return <div className="flex fixed top-0 py-1 gap-2 justify-between w-full px-2 items-center" style={{
      backgroundColor: 'rgba(214, 219, 220,1)'
    }}>

      <div
        onClick={() => setShowModel(!showModel)}
        className="flex text-sm gap-2 cursor-pointer opacity-50 hover:opacity-90">
        <RocketLaunchIcon className="h-5 w-5" />
        <p className="text-center">
          {model}
        </p>
      </div>
      <div
        ref={modelRef}
        className={`
      ${showModel ? "absolute" : "hidden"}
       left-8 top-8 bg-white border h-auto p-2 rounded-lg hover:shadow-xl transition-all cursor-pointer`}>
        {llmModels.map((llm) => (
          <div
            onClick={() => { setModel(llm.model); setShowModel(false); }}
            key={llm.id} className="flex gap-2 items-center opacity-50 hover:opacity-90">
            {llm.model}
          </div>
        ))}
      </div>
      <div className="flex-1" />
      <a
        href='https://github.com/aaronbesson/groqet'
        target="_blank"
        className="opacity-30 hover:opacity-90 cursor-pointer transition-all duration-700 bg-white p-1 rounded-lg flex gap-1 text-xs pr-2 items-center">
        <Image src="/github-icon.svg" alt="Groquet" width={16} height={16} className="" />
        Github
      </a>
      <a href="https://www.buymeacoffee.com/aaronbesson" target="_blank">
        <Image src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" className="w-24 h-6 rounded-lg shadow" width={100} height={32} />
      </a>
    </div>;
  }
}
