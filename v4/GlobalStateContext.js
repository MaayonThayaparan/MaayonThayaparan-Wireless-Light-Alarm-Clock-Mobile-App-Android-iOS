import React, { createContext, useState } from 'react'; //createContext used to create new Context, useState used to manage state within component
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GlobalStateContext = createContext(); // create the context to hold global state

// provides that global state to chidren
export const GlobalStateProvider = ({ children }) => {


  const [headers, setHeaders] = useState({
    'Content-Type': 'application/json',
    'Govee-API-Key': '714cfe09-7dd5-4ba0-aa53-34c921fabb26',
  });

  const [urlGet, setUrlGet] = useState('https://openapi.api.govee.com/router/api/v1/user/devices');
  const [urlPost, setUrlPost] = useState('https://openapi.api.govee.com/router/api/v1/device/control');

  return (
    <GlobalStateContext.Provider value={{ headers, setHeaders, urlGet, setUrlGet, urlPost, setUrlPost }}>
      {children}
    </GlobalStateContext.Provider>
  );
};