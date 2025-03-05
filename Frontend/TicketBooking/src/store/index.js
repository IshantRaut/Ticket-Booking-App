// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import trainReducer from './trainSlice';
const store = configureStore({
  reducer: {
    auth: authReducer, // We'll define this next
    trains:trainReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(), // Includes thunk by default
});

export default store;