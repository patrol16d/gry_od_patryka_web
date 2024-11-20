import './App.css'
import LobbyRTV from './lobby/LobbyRTV.tsx';
import UserNameGate from './lobby/UserNameGate.tsx';

function App() {
  return (
    <UserNameGate>
      <LobbyRTV />
    </UserNameGate>
  )
}

export default App
