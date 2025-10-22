import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { store, persistor } from './store/store'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App.jsx'
import './index.css'

// Load Razorpay script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      resolve(); // Continue even if Razorpay fails to load
    };
    document.head.appendChild(script);
  });
};

// Load Razorpay script on app start
loadRazorpay();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
) 