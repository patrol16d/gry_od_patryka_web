// RealTimeValue.js
import { useEffect, useState, useContext } from 'react';
import { UserContext } from './UserContext';
import { db } from '../firebase.ts';
import { ref, onValue, set, update } from 'firebase/database';
import RoomList from './RoomList.tsx';

const LobbyRTV: React.FC = () => {
  const { userName } = useContext(UserContext);
  const [value, setValue] = useState(null);

  useEffect(() => {
    const valueRef = ref(db, '/lobby');

    // Nasłuchiwanie zmian w czasie rzeczywistym
    const unsubscribe = onValue(valueRef, (snapshot) => {
      const data = snapshot.val();
      setValue(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (value == null) return (<>Ładowanie...</>);

  const joinRoom = (room: string) => {
    const valueRef = ref(db, `/lobby/players/${userName}/room`);
    set(valueRef, room);
  }

  const startRoom = (room: string) => {
    const gameRoomKey = `${Date.now()}`;
    const players: {[player: string]: string} = {};
    Object.keys(value['players'])
      .filter(p => value['players'][p]['room'] == room && value['players'][p]['gameRoom'] == null)
      .forEach(p => players[`${p}/gameRoom`] = gameRoomKey);
    const valueRef = ref(db, `/lobby/players`);
    update(valueRef, players);
  }

  const watchRoom = (gameRoom: string) => {
    const valueRef = ref(db, `/lobby/players/${userName}/gameRoom`);
    set(valueRef, gameRoom);
  }

  return (
    <RoomList rooms={Object.keys(value['rooms'])}
      players={value['players']}
      joinRoom={joinRoom}
      startRoom={startRoom}
      watchRoom={watchRoom}
    />
  );

  // <pre style={{ textAlign: 'left' }}>{JSON.stringify(value, null, '\t')}</pre>
};

export default LobbyRTV;
