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
        console.log("Fetched Test Text:", res.data); // Debugging
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
    
    if (!startTime) {
      setStartTime(Date.now());
    }

    if (testText && value.length > 0) {
      const lastChar = value[value.length - 1];
      const expectedChar = testText.text[currentIndex];
      
      if (lastChar !== expectedChar) {
        setErrors(prev => prev + 1);
      }
    }
    
    setInput(value);
    setCurrentIndex(value.length);
    
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
    if (!testText || !testText.text) return <p className="text-gray-400">Loading text...</p>;

    return testText.text.split('').map((char, index) => {
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

      <div className="bg-gray-800 p-6 rounded-lg shadow-md mt-6">
        <div className="text-xl font-mono min-h-[100px]">{loading ? <p>Loading...</p> : formatText()}</div>
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
    </div>
  );
};

export default TypingTest;
