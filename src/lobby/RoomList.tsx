import React, { useState, useContext } from 'react';
import { UserContext } from './UserContext';
import './RoomList.css'; // Import stylów

interface PlayerData {
  color: number;
  room: string;
  time: number; // Unix timestamp
  version: string;
  gameRoom?: string;
}

interface Players {
  [userName: string]: PlayerData;
}

interface RoomListProps {
  rooms: string[];
  players: Players;
  joinRoom: (room: string) => void;
  startRoom: (room: string) => void;
  watchRoom: (gameRoom: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, players, joinRoom, startRoom, watchRoom }) => {
  const { userName } = useContext(UserContext);

  // Sortowanie pokoi, aby 'Poczekalnia' była pierwsza
  const sortedRooms = rooms.includes('Poczekalnia')
    ? ['Poczekalnia', ...rooms.filter((room) => room !== 'Poczekalnia')]
    : rooms;

  // Funkcja pomocnicza do filtrowania graczy
  const filterPlayersByRoom = (room: string) => {
    const now = Date.now();
    const groups: { [gameRoom: string]: Array<{ name: string; data: PlayerData }> } = {};
    const onlinePlayers: Array<{ name: string; data: PlayerData }> = [];
    const offlinePlayers: Array<{ name: string; data: PlayerData }> = [];

    Object.entries(players).forEach(([name, data]) => {
      if (data.room === room) {
        const timeDifference = now - data.time;
        if (timeDifference <= 3600000) {
            if (data.gameRoom) {
                if (!groups[data.gameRoom]) groups[data.gameRoom] = [];
                groups[data.gameRoom].push({ name, data });
            }
            else {
                onlinePlayers.push({ name, data });
            }
        } else {
          // Gracz offline
          offlinePlayers.push({ name, data });
        }
      }
    });

    return { groups, onlinePlayers, offlinePlayers };
  };

  // Funkcja formatująca różnicę czasu
  const formatTimeDifference = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp; // różnica w milisekundach

    const minutes = Math.floor(diff / 60000);
    if (minutes < 5) {
        return '';
    }

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  // Stan do zarządzania rozwijaniem zakładek offline
  const [offlineOpenRooms, setOfflineOpenRooms] = useState<{ [room: string]: boolean }>({});

  const toggleOffline = (room: string) => {
    setOfflineOpenRooms((prev) => ({
      ...prev,
      [room]: !prev[room],
    }));
  };

  const roomTitle = (room: string) => (
    <div className="room-title">
      <h2 className={room == players[userName!]?.room ? "room-name my-player" : "room-name"}>{room}</h2>
      {/* Przyciski akcji */}
      {room !== players[userName!]?.room ? (
        <button className="room-button" onClick={() => joinRoom(room)}>
          Dołącz
        </button>
      ) : room !== 'Poczekalnia' ? (
        <button className="room-button" onClick={() => startRoom(room)}>Rozpocznij</button>
      ) : null}
    </div>
  );

  const playerList = (players: Array<{ name: string; data: PlayerData }>) => (
    <ul className="player-list">
        {players.map(({ name, data }) => (
            <li key={name} className="player-item">
            <span className={name == userName ? "player-name my-player" : "player-name"}>{name}</span>
            <span className="player-time">{formatTimeDifference(data.time)}</span>
            </li>
        ))}
    </ul>
  )

  return (
    <div className="container">
      {sortedRooms.map((room) => {
        const { groups, onlinePlayers, offlinePlayers } = filterPlayersByRoom(room);

        return (
          <div key={room} className="room-container">
            {roomTitle(room)}

            {onlinePlayers.length > 0 ? <h3>Gracze online:</h3> : null}
            {playerList(onlinePlayers)}

            {Object.keys(groups).length > 0 ? (<h3>Bierzące rozgrywki:</h3>) : null}
            {Object.entries(groups).map(([gameRoom, players]) => (
                <div key={gameRoom} className="game-room-container">
                    <h4 className="game-room-title">
                        <span className="game-room-name">{gameRoom}</span>
                        <button className="game-room-button" onClick={() => watchRoom(gameRoom)}>Obserwuj</button>
                    </h4>
                    {playerList(players)}
                </div>
            ))}

            {/* Zakładka offline tylko w 'Poczekalni' */}
            {offlinePlayers.length > 0 && (
              <div className="offline-toggle">
                <h3 onClick={() => toggleOffline(room)}>
                  {offlineOpenRooms[room] ? '▼' : '▶'} Gracze offline ({offlinePlayers.length})
                </h3>
                {offlineOpenRooms[room] && playerList(offlinePlayers)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoomList;
