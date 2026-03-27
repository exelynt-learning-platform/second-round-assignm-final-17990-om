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
  async (userText, { rejectWithValue, getState }) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      return rejectWithValue(
        'API key is not configured. Add VITE_OPENAI_API_KEY to your .env file.'
      );
    }

    try {
      // Include full conversation history so AI has context
      const { messages } = getState().chat;
      const history = messages.map(({ role, content }) => ({ role, content }));
      history.push({ role: 'user', content: userText });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: history,
        }),
      });

      if (response.status === 401)
        return rejectWithValue('Invalid API key. Please check your VITE_OPENAI_API_KEY in .env.');
      if (response.status === 429)
        return rejectWithValue('Rate limit exceeded. Please wait a moment and try again.');
      if (response.status === 500)
        return rejectWithValue('OpenAI server error. Please try again later.');
      if (!response.ok)
        return rejectWithValue(`Request failed: ${response.status} ${response.statusText}`);

      const data = await response.json();
      return data.choices[0].message.content.trim();
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
