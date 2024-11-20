import { createContext, useContext } from 'react';

interface UserContextType {
  userName: string | null;
  setUserName: (name: string) => void;
}

export const UserContext = createContext<UserContextType>({
  userName: null,
  setUserName: () => {},
});

export const useUser = () => useContext(UserContext);
