import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const Typewriter = ({ text, delay, infinite, fontSize }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let timeout;

    if (currentIndex < text.length) {
      timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);

    } else if (infinite) {
      setCurrentIndex(0);
      setCurrentText('');
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, delay, infinite, text]);

  return (
    <ReactMarkdown
      className="typewriter p-4 text-left w-full"
      components={{ 
        p: ({ node, ...props }) => (
          <p style={{
            fontSize: fontSize,
            fontWeight: 'thin',
          }} {...props}/>
        ),
        custom: ({ node, ...props }) => <span {...props}/>,
      }}
    >
      {currentText}
    </ReactMarkdown>
  );
};

export default Typewriter;
