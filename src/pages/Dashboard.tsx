import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Award, BarChart2, ChevronRight } from 'lucide-react';

interface UserStats {
  bestByDifficulty: {
    [key: string]: {
      wpm: number;
      accuracy: number;
    };
  };
  average: {
    wpm: number;
    accuracy: number;
    totalTests: number;
  };
}

interface TestResult {
  _id: string;
  difficulty: string;
  wpm: number;
  accuracy: number;
  date: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentTests, setRecentTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats
        const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/stats`);
        setStats(statsRes.data);
        
        // Fetch recent test results
        const testsRes = await axios.get(`${import.meta.env.VITE_API_URL}/tests/results`);
        setRecentTests(testsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.username}!</h1>
          <p className="text-gray-400">Track your progress and start a new typing test.</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Link
            to="/test/easy"
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            Easy Test
          </Link>
          <Link
            to="/test/medium"
            className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
          >
            Medium Test
          </Link>
          <Link
            to="/test/hard"
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Hard Test
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-600 bg-opacity-10">
              <BarChart2 className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Average WPM</p>
              <p className="text-2xl font-semibold">{stats?.average.wpm || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-600 bg-opacity-10">
              <Award className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Average Accuracy</p>
              <p className="text-2xl font-semibold">{stats?.average.accuracy || 0}%</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-600 bg-opacity-10">
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Tests</p>
              <p className="text-2xl font-semibold">{stats?.average.totalTests || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Scores by Difficulty */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Best Scores by Difficulty</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-green-400">Easy</h3>
              <span className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded-full">Beginner</span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-400">Best WPM</p>
                <p className="text-2xl font-bold">{stats?.bestByDifficulty?.easy?.wpm || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Accuracy</p>
                <p className="text-2xl font-bold">{stats?.bestByDifficulty?.easy?.accuracy || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-yellow-400">Medium</h3>
              <span className="text-xs px-2 py-1 bg-yellow-900 text-yellow-300 rounded-full">Intermediate</span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-400">Best WPM</p>
                <p className="text-2xl font-bold">{stats?.bestByDifficulty?.medium?.wpm || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Accuracy</p>
                <p className="text-2xl font-bold">{stats?.bestByDifficulty?.medium?.accuracy || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-red-400">Hard</h3>
              <span className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded-full">Advanced</span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-400">Best WPM</p>
                <p className="text-2xl font-bold">{stats?.bestByDifficulty?.hard?.wpm || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Accuracy</p>
                <p className="text-2xl font-bold">{stats?.bestByDifficulty?.hard?.accuracy || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tests */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Recent Tests</h2>
        </div>
        {recentTests.length > 0 ? (
          <div className="divide-y divide-gray-700">
            {recentTests.map((test) => (
              <div key={test._id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center">
                    <span 
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        test.difficulty === 'easy' 
                          ? 'bg-green-500' 
                          : test.difficulty === 'medium' 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                    ></span>
                    <span className="font-medium capitalize">{test.difficulty} Test</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {new Date(test.date).toLocaleDateString()} at {new Date(test.date).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">WPM</p>
                    <p className="font-bold">{test.wpm}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Accuracy</p>
                    <p className="font-bold">{test.accuracy}%</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-400">You haven't taken any tests yet.</p>
            <p className="mt-2">
              <Link to="/test/easy" className="text-purple-500 hover:text-purple-400">
                Start your first test
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;