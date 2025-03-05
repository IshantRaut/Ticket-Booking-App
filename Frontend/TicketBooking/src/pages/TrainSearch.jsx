// src/pages/TrainSearch.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrains, setSearchParams } from '../store/trainSlice';
import TrainList from '../components/TrainList';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

function TrainSearch() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const dispatch = useDispatch();
  const { trains, loading, error, source: reduxSource, destination: reduxDestination } = useSelector((state) => state.trains);

  useEffect(() => {
    if (reduxSource && reduxDestination) {
      setSource(reduxSource);
      setDestination(reduxDestination);
      dispatch(fetchTrains({ source: reduxSource, destination: reduxDestination }))
        .unwrap()
        .then(() => toast.success('Trains loaded successfully!', {
          style: { fontFamily: 'serif', color: '#2C3E50' },
        }))
        .catch((err) => toast.error(err || 'Failed to load trains', {
          style: { fontFamily: 'serif', color: '#2C3E50' },
        }));
    }
  }, [dispatch, reduxSource, reduxDestination]);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      dispatch(setSearchParams({ source, destination }));
      await dispatch(fetchTrains({ source, destination })).unwrap();
      if (trains.length === 0) {
        toast.info('No trains found for this route.', {
          style: { fontFamily: 'serif', color: '#2C3E50' },
        });
      } else {
        toast.success('Search completed successfully!', {
          style: { fontFamily: 'serif', color: '#2C3E50' },
        });
      }
    } catch (err) {
      toast.error(err || 'Search failed', {
        style: { fontFamily: 'serif', color: '#2C3E50' },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F8FF] p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <FaSearch className="text-5xl text-[#4682B4] animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-[#2C3E50] text-center mb-8 font-serif">
          Search Trains
        </h1>
        <Link to="/" className="text-[#4682B4] hover:text-[#5A9BD4] mb-6 inline-block transition-colors duration-200 font-serif font-medium">Back to Home</Link>
        <form onSubmit={handleSearch} className="bg-[#F9FAFB] p-6 rounded-2xl shadow-lg mb-8 border-t-4 border-[#4682B4]">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source (e.g., Delhi)"
              className="w-full p-3 border border-[#4682B4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A9BD4] transition-all duration-200 bg-[#F0F8FF] text-[#2C3E50] font-serif"
              required
            />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination (e.g., Mumbai)"
              className="w-full p-3 border border-[#4682B4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A9BD4] transition-all duration-200 bg-[#F0F8FF] text-[#2C3E50] font-serif"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full md:w-auto p-3 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 text-center mb-4 font-serif font-medium">{error}</p>}
        <TrainList trains={trains} />
      </div>
    </div>
  );
}

export default TrainSearch;