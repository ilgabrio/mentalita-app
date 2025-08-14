import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, BookOpen, User } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Benvenuto in Mentalità</h2>
        <p className="opacity-90">Sviluppa la tua forza mentale nello sport</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/exercises"
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <PlayCircle className="text-blue-600 mb-2" size={24} />
          <h3 className="font-semibold text-gray-900 dark:text-white">Esercizi</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Meditazione e mindfulness</p>
        </Link>

        <Link
          to="/videos"
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <BookOpen className="text-green-600 mb-2" size={24} />
          <h3 className="font-semibold text-gray-900 dark:text-white">Video</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Contenuti formativi</p>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;