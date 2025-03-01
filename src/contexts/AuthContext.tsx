import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const TypingTest: React.FC = () => {
  const { difficulty = 'easy' } = useParams<{ difficulty: string }>();

  // State for the custom test text
  const [testText, setTestText] = useState('The quick brown fox jumps over the lazy dog.');
  const [customText, setCustomText] = useState(testText); // Input field value

  const [input, setInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Timer
  useEffect(() => {
    if (startTime && !endTime) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [startTime, endTime]);

  // Calculate WPM and accuracy
  const calculateStats = useCallback(() => {
    if (!startTime || !endTime) return;

    const minutes = (endTime - startTime) / 60000;
    const words = testText.trim().split(/\s+/).length;
    const calculatedWpm = Math.round(words / minutes);

    const totalChars = testText.length;
    const calculatedAccuracy = Math.round(((totalChars - errors) / totalChars) * 100);

    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy > 0 ? calculatedAccuracy : 0);
  }, [startTime, endTime, errors, testText]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!startTime) {
      setStartTime(Date.now());
    }

    if (value.length > 0) {
      const lastChar = value[value.length - 1];
      const expectedChar = testText[currentIndex];

      if (lastChar !== expectedChar) {
        setErrors(prev => prev + 1);
      }
    }

    setInput(value);
    setCurrentIndex(value.length);

    if (value.length === testText.length) {
      finishTest();
    }
  };

  // Finish test
  const finishTest = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    setEndTime(Date.now());
    setIsFinished(true);
  };

  // Calculate results when test is finished
  useEffect(() => {
    if (isFinished) {
      calculateStats();
    }
  }, [isFinished, calculateStats]);

  // Restart test
  const restartTest = () => {
    setInput('');
    setCurrentIndex(0);
    setStartTime(null);
    setEndTime(null);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setIsFinished(false);
    setElapsedTime(0);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Update test text dynamically
  const handleTestTextChange = () => {
    setTestText(customText); // Update the test text
    restartTest(); // Reset everything
  };

  // Format the text with current position highlighting
  const formatText = () => {
    return testText.split('').map((char, index) => {
      let className = '';

      if (index < currentIndex) {
        className = input[index] === char ? 'text-green-400' : 'text-red-500';
      } else if (index === currentIndex) {
        className = 'bg-purple-700 text-white';
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold capitalize">{difficulty} Typing Test</h1>
      <p className="text-gray-400">Type the text below as quickly and accurately as possible.</p>

      {/* Text Input for Custom Test Text */}
      <div className="mt-4">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          placeholder="Enter custom test text..."
        />
        <button
          onClick={handleTestTextChange}
          className="mt-2 px-4 py-2 bg-green-500 rounded-lg"
        >
          Set Test Text
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md mt-6">
        <div className="text-xl font-mono min-h-[100px]">{formatText()}</div>
        {!isFinished && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white mt-4"
            placeholder="Start typing..."
          />
        )}
      </div>

      {isFinished && (
        <div className="mt-4 text-white">
          <p>WPM: {wpm}</p>
          <p>Accuracy: {accuracy}%</p>
          <button
            onClick={restartTest}
            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
          >
            Restart Test
          </button>
        </div>
      )}
    </div>
  );
};

export default TypingTest;
