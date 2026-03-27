import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../features/chat/chatSlice';

const store = configureStore({
  reducer: {
    chat: chatReducer,
  },
  // getDefaultMiddleware includes redux-thunk by default (handles async API calls)
  // serializableCheck warns if non-serializable values enter the store
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
    }),
  // Redux DevTools enabled only in development for debugging
  devTools: import.meta.env.DEV,
});

export default store;
