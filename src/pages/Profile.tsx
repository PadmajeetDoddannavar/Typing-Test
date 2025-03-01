import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { User, Clock, Award, BarChart2 } from 'lucide-react';

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
  duration: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats
        const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/stats`);
        setStats(statsRes.data);
        
        // Fetch test history
        const historyRes = await axios.get(`${import.meta.env.VITE_API_URL}/tests/results`);
        setTestHistory(historyRes.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 bg-gray-700 md:w-48 flex justify-center items-center py-8">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-purple-600 flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-purple-500 font-semibold">User Profile</div>
            <h2 className="mt-1 text-2xl font-bold">{user?.username}</h2>
            <p className="mt-2 text-gray-400">{user?.email}</p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-400">Total Tests</p>
                  <p className="font-bold">{stats?.average.totalTests || 0}</p>
                </div>
              </div>
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-400">Average WPM</p>
                  <p className="font-bold">{stats?.average.wpm || 0}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-400">Average Accuracy</p>
                  <p className="font-bold">{stats?.average.accuracy || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Performance by Difficulty</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Best WPM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Best Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                      <span>Easy</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats?.bestByDifficulty?.easy?.wpm || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats?.bestByDifficulty?.easy?.accuracy || 0}%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
                      <span>Medium</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats?.bestByDifficulty?.medium?.wpm || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats?.bestByDifficulty?.medium?.accuracy || 0}%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                      <span>Hard</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats?.bestByDifficulty?.hard?.wpm || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stats?.bestByDifficulty?.hard?.accuracy || 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Test History</h2>
        </div>
        {testHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">WPM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {testHistory.map((test) => (
                  <tr key={test._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(test.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span 
                          className={`h-3 w-3 rounded-full mr-2 ${
                            test.difficulty === 'easy' 
                              ? 'bg-green-500' 
                              : test.difficulty === 'medium' 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}
                        ></span>
                        <span className="capitalize">{test.difficulty}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{test.wpm}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{test.accuracy}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{test.duration}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400">
            <p>No test history available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;