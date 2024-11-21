import { useEffect, useState, useContext } from 'react';
import { UserContext } from './UserContext.tsx';
import { onValue, set, update, get } from '../firebase.ts';
import LobbyRTV from '../lobby/LobbyRTV.tsx';
import MonopolyRTV from '../monopoly/game_board/MonopolyRTV.tsx';

let updateMyTimeRunning = false;

const UserRTV: React.FC = () => {
  const { userName } = useContext(UserContext);
  const [gameRoom, setGameRoom] = useState(null);
  const [gameName, setGameName] = useState(null);

  const updateMyTime = (init: boolean = false) => {
    if (init && updateMyTimeRunning) return;
    updateMyTimeRunning = true;
    set(`/lobby/players/${userName}/time`, Date.now());
    setTimeout(updateMyTime, 5000);
  }

  useEffect(() => {
    const unsubscribe = onValue(`/lobby/players/${userName}/gameRoom`, (snapshot) => {
      const data = snapshot.val();
      if (gameRoom != data) {
        setGameRoom(data);
        if (data !== null) {
          get(`/games/rooms/${data}/name`).then(async value => {
            const name = value.val();
            setGameName(name);
            if (name == null) {
              await update('/', {
                [`/lobby/players/${userName}/gameRoom`]: null,
                [`/games/rooms/${data}`]: null,
              });
            }
          })
        }
      }
    });

    updateMyTime(true);

    return () => {
      unsubscribe();
    };
  }, []);

  if (gameRoom == null) return (<LobbyRTV />);

  if (gameName == null) return (<>Ładowanie...</>);

  if (gameName == 'Monopoly') {
    return <MonopolyRTV gameRoom={gameRoom} />
  }

  return (
    <>
      Gra {gameName} nie ma jeszcze wspracia webowego
      <pre style={{ textAlign: 'left' }}>{JSON.stringify(gameRoom, null, '\t')}</pre>
    </>
  );
};

export default UserRTV;
