import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const timestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const initialState = {
  messages: [], // { id, role: 'user' | 'assistant', content, timestamp }
  status: 'idle', // 'idle' | 'loading'
  error: null,
};

// Sends user message to OpenAI API and returns AI reply
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (userText, { rejectWithValue }) => {
    try {
      const API_URL = import.meta.env.DEV
        ? '/api/Stage/'
        : import.meta.env.VITE_API_URL;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userText }),
      });

      if (!response.ok) {
        return rejectWithValue(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let answer = data.body;
      if (typeof answer === 'string') {
        try {
          const parsed = JSON.parse(answer);
          answer = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        } catch {
          answer = answer.trim().replace(/^"|"$/g, '');
        }
      }
      return answer;
    } catch {
      return rejectWithValue(
        'Network error. Please check your internet connection and try again.'
      );
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Adds user message to state immediately before API responds
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now(),
        role: 'user',
        content: action.payload,
        timestamp: timestamp(),
      });
      state.error = null;
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.status = 'idle';
        state.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: action.payload,
          timestamp: timestamp(),
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload || 'Something went wrong. Please try again.';
      });
  },
});

export const { addUserMessage, clearChat, clearError } = chatSlice.actions;
export default chatSlice.reducer;
