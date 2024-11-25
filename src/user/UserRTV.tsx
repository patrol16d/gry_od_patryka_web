import { useEffect, useState, useContext } from 'react';
import { UserContext } from './UserContext.tsx';
import { onValue, set, update, get } from '../firebase.ts';
import LobbyRTV from '../lobby/LobbyRTV.tsx';
import MonopolyRTV from '../monopoly/game_board/MonopolyRTV.tsx';

let updateMyTimeRunning = false;

const UserRTV: React.FC = () => {
  const { userName } = useContext(UserContext);
  const [gameRoom, setGameRoom] = useState('');
  const [gameName, setGameName] = useState(null);

  const updateMyTime = (init: boolean = false) => {
    if (init && updateMyTimeRunning) return;
    // console.info('updateMyTime');
    updateMyTimeRunning = true;
    if (!document.hidden) set(`/lobby/players/${userName}/time`, Date.now());
    // setTimeout(updateMyTime, 5000);
  }

  // console.info('UserRTV', gameRoom);

  useEffect(() => {
    // console.info('UserRTV useEffect', gameRoom);
    const unsubscribe = onValue(`/lobby/players/${userName}/gameRoom`, (snapshot) => {
      // console.info('UserRTV useEffect /lobby/players/${userName}/gameRoom = ', gameRoom);
      const data = `${snapshot.val() ?? ''}`;
      // console.info('UserRTV useEffect /lobby/players/${userName}/gameRoom = ', gameRoom, data);
      if (gameRoom !== data) {
        if (data !== '') {
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
        setGameRoom(data);
      }
    });

    updateMyTime(true);

    return () => {
      unsubscribe();
    };
  }, [gameRoom]);

  if (gameRoom == '') return (<LobbyRTV />);

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
