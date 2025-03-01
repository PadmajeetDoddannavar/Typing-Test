import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface TestText {
  _id: string;
  text: string;
  difficulty: string;
}

const TypingTest: React.FC = () => {
  const { difficulty = 'easy' } = useParams<{ difficulty: string }>();
  const navigate = useNavigate();
  
  const [testText, setTestText] = useState<TestText | null>(null);
  const [input, setInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  
  // Fetch test text
  useEffect(() => {
    const fetchTestText = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/tests/text/${difficulty}`);
        setTestText(res.data);
      } catch (error) {
        console.error('Error fetching test text:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestText();
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [difficulty]);
  
  // Focus input on load
  useEffect(() => {
    if (inputRef.current && !loading) {
      inputRef.current.focus();
    }
  }, [loading]);
  
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
    if (!startTime || !endTime || !testText) return;
    
    const minutes = (endTime - startTime) / 60000;
    const words = testText.text.trim().split(/\s+/).length;
    const calculatedWpm = Math.round(words / minutes);
    
    const totalChars = testText.text.length;
    const calculatedAccuracy = Math.round(((totalChars - errors) / totalChars) * 100);
    
    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy > 0 ? calculatedAccuracy : 0);
  }, [startTime, endTime, testText, errors]);
  
  // Save results
  const saveResults = useCallback(async () => {
    if (!testText || !endTime || !startTime) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/tests/results`, {
        difficulty: testText.difficulty,
        wpm,
        accuracy,
        completedText: testText.text,
        duration: Math.round((endTime - startTime) / 1000)
      });
    } catch (error) {
      console.error('Error saving test results:', error);
    }
  }, [testText, endTime, startTime, wpm, accuracy]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Start timer on first input
    if (!startTime) {
      setStartTime(Date.now());
    }
    
    // Check for errors
    if (testText && value.length > 0) {
      const lastChar = value[value.length - 1];
      const expectedChar = testText.text[currentIndex];
      
      if (lastChar !== expectedChar) {
        setErrors(prev => prev + 1);
      }
    }
    
    setInput(value);
    setCurrentIndex(value.length);
    
    // Check if test is complete
    if (testText && value.length === testText.text.length) {
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
  
  // Calculate and save results when test is finished
  useEffect(() => {
    if (isFinished) {
      calculateStats();
    }
  }, [isFinished, calculateStats]);
  
  useEffect(() => {
    if (isFinished && wpm > 0) {
      saveResults();
    }
  }, [isFinished, wpm, saveResults]);
  
  // Restart test
  const restartTest = async () => {
    setInput('');
    setCurrentIndex(0);
    setStartTime(null);
    setEndTime(null);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setIsFinished(false);
    setElapsedTime(0);
    
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/tests/text/${difficulty}`);
      setTestText(res.data);
      setLoading(false);
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error fetching new test text:', error);
      setLoading(false);
    }
  };
  
  // Format the text with current position highlighting
  const formatText = () => {
    if (!testText) return null;
    
    return testText.text.split('').map((char, index) => {
      let className = '';
      
      if (index < currentIndex) {
        // Character has been typed
        className = input[index] === char ? 'text-green-400' : 'text-red-500';
      } else if (index === currentIndex) {
        // Current character
        className = 'bg-purple-700 text-white';
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold capitalize">{difficulty} Typing Test</h1>
          <p className="text-gray-400">Type the text below as quickly and accurately as possible.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-xl font-mono">{elapsedTime}s</span>
          </div>
          <button
            onClick={restartTest}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <div className="text-xl leading-relaxed font-mono mb-6 min-h-[100px]">
          {formatText()}
        </div>
        
        {!isFinished ? (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Start typing..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        ) : (
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Test Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="font-medium">Time</h3>
                </div>
                <p className="text-2xl font-bold">{elapsedTime}s</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="font-medium">WPM</h3>
                </div>
                <p className="text-2xl font-bold">{wpm}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="font-medium">Accuracy</h3>
                </div>
                <p className="text-2xl font-bold">{accuracy}%</p>
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={restartTest}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Tips for Better Typing</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Keep your fingers positioned over the home row keys (ASDF JKL;)</li>
          <li>Look at the screen, not your keyboard</li>
          <li>Use all ten fingers, each responsible for specific keys</li>
          <li>Practice regularly to build muscle memory</li>
          <li>Focus on accuracy first, then speed will follow</li>
        </ul>
      </div>
    </div>
  );
};

export default TypingTest;