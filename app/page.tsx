'use client';
import { MicrophoneIcon } from "@heroicons/react/16/solid";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { CloudArrowDownIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Typewriter from "./components/Typewriter";
import Lottie from "lottie-react";
import groqet from "../public/groqet.json"


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

interface Window { // add webkitSpeechRecognition to window
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

  const getAudioData = async (message: any) => {
    try {
      const reqBody = { message };
      const response = await fetch('/api/googletts', { // send request to google tts api
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });
      const data = await response.json(); // Ensure proper data URI format for audio
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

  const sendMessage = async (recordedText: any) => { // send message to groq api

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

      const newMessage = {
        type: "assistant",
        value: data.output
      };

      if (data.output !== "") {
        setReply(data.output);
      }
      if (isListening) { // if the app is listening, play the audio
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
    const handleClick = (e: MouseEvent) => { // close model on click outside
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModel(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    }
  }, [modelRef]);

  const handleClick = () => { // stop audio on click
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }

  useEffect(() => { // check if speech recognition is available
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as Window).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => { // on result, set the prompt and send the message
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

  const startListening = () => { // start listening to microphone
    setReply("Hello! I'm Groqet, start speaking to ask me a question.")
    setIsListening(true);
    if (recognition) {
      recognition.start();
    }
  };

  const stopListening = () => { // stop listening
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

  useEffect(() => { // get audio data when reply changes
    if (reply !== "" && isListening) {
      getAudioData(reply);
    }
  }, [reply]);

  useEffect(() => { // Try scroll to bottom of chat window
    if (windowRef.current) {
      const scrollHeight = windowRef.current.scrollHeight;
      windowRef.current.scrollTop = scrollHeight
    }
  }, [messages, windowRef]);

  return (<div>
    {Header()}
    <main className="flex flex-col items-center justify-between w-full h-svh font-mono">
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

        {!reply &&
          <div className="text-center flex flex-col gap-2">
            <Lottie animationData={groqet} loop={true} className="w-32 h-32 mx-auto" />
            Welcome to Groqet
          </div>}

      </div>

      <div className="p-2 flex items-center gap-4 w-full bg-gray-100 px-4 border-t border-gray-200">

        <CloudArrowDownIcon
          onClick={downloadMessages}
          className="h-6 w-6 text-gray-500 hover:text-black cursor-pointer" />

        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendMessage(prompt);
            }
          }}
          className="flex bg-white w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
          placeholder="Ask me a question"
        />

        <button
          disabled={loading}
          onClick={() => sendMessage(prompt)}
          className="rounded-lg bg-black p-2 text-white">
          {loading ? <ArrowPathIcon className="h-6 w-6 animate-spin" aria-hidden="true" />
            : "Send"}
        </button>

        {!isListening ?
          <MicrophoneIcon
            onClick={startListening}
            className="h-6 w-6 text-gray-500 hover:text-black cursor-pointer" />
          :
          <MicrophoneIcon
            onClick={stopListening}
            className="h-6 w-6 text-red-500 animate-pulse cursor-pointer" />
        }
      </div>
    </main>
  </div>
  );

  function Header() {
    return <div className="flex fixed top-0 py-1 gap-2 justify-between w-full px-2 items-center font-mono">

      <div
        onClick={() => setShowModel(!showModel)}
        className="flex text-xs gap-2 cursor-pointer opacity-50 hover:opacity-90 bg-white rounded-lg px-2 py-1 items-center hover:shadow transition-all duration-700">
        <RocketLaunchIcon className="h-5 w-5" />
        <p className="text-center">
          {model}
        </p>
      </div>
      <div
        ref={modelRef}
        className={`
      ${showModel ? "left-8" : "-left-48"}
      absolute  top-10 bg-white border p-2 rounded-lg opacity-50 hover:opacity-90 hover:shadow-xl transition-all cursor-pointer duration-700 flex-col gap-2`}>
        {llmModels.map((llm) => (
          <div
            onClick={() => { setModel(llm.model); setShowModel(false); }}
            key={llm.id} className="flex gap-2 items-center text-xs text-gray-400 hover:text-gray-700">
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
    </div>;
  }
}
