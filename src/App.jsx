import React from 'react';
import { Provider } from 'react-redux';
import store from './app/store';
import ChatBox from './components/ChatBox';

function App() {
  return (
    <Provider store={store}>
      <ChatBox />
    </Provider>
  );
}

export default App;
