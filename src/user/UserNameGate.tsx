// UserNameGate.tsx
import React, { useState, useEffect } from 'react';
import { UserContext } from './UserContext';

interface UserNameGateProps {
  children: React.ReactNode;
}

const UserNameGate: React.FC<UserNameGateProps> = ({ children }) => {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Sprawdzanie cookies przy pierwszym renderowaniu
  useEffect(() => {
    const storedUserName = getCookie('userName');
    if (storedUserName) {
      setUserNameState(storedUserName);
    }
  }, []);

  // Funkcja do ustawiania nazwy użytkownika
  const setUserName = (name: string) => {
    setUserNameState(name);
    setCookie('userName', name, 365); // Zapisujemy na 1 rok
  };

  // Obsługa klawisza Enter w polu tekstowym
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      setUserName(inputValue.trim());
    }
  };

  // Jeśli nie ma userName, wyświetlamy pole tekstowe
  if (!userName) {
    return (
      <div style={fullScreenCenteredStyle}>
        <input
          type="text"
          placeholder="Wpisz swoją nazwę"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />
      </div>
    );
  }

  // Jeśli userName jest dostępne, udostępniamy je przez kontekst i wyświetlamy dzieci
  return (
    <UserContext.Provider value={{ userName, setUserName }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserNameGate;

const fullScreenCenteredStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  padding: '10px',
  fontSize: '16px',
};

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';').map((c) => c.trim());
  for (let i = 0; i < ca.length; i++) {
    const c = ca[i];
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
}
