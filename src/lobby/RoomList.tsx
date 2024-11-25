import React, { useState, useContext } from 'react';
import { UserContext } from '../user/UserContext';
import './RoomList.css';
import { PlayerData, Players } from './LobbyRTV';
import { playersColors } from '../monopoly/models/player';
import { set } from '../firebase.ts';

interface RoomListProps {
  roomsList: string[];
  players: Players;
  joinRoom: (room: string) => void;
  startRoom: (room: string, players: Players) => void;
  watchRoom: (room: string, gameRoom: string) => void;
}

const togglePlayerColor = (playerName: string, player: PlayerData) => {
  if (player.room == 'Monopoly') {
    const nextColor = ((player.monopolyColor ?? 0) + 1) % playersColors.length;
    set(`/lobby/players/${playerName}/monopolyColor`, nextColor);
  }
}

const RoomList: React.FC<RoomListProps> = ({ roomsList, players, joinRoom, startRoom, watchRoom }) => {
  const { userName } = useContext(UserContext);

  const sortedRooms = ['Poczekalnia', ...roomsList.filter(room => room !== 'Poczekalnia')];

  const rooms = roomsList.reduce((map: {
    [room: string]: {
      'onlinePlayers': Players,
      'groups': { [gameRoom: string]: Players },
      'offlinePlayers': Players
    }
  }, room) => {
    map[room] = {
      'onlinePlayers': {},
      'groups': {},
      'offlinePlayers': {},
    };
    return map;
  }, {});

  const now = Date.now();

  Object.entries(players).forEach(([name, data]) => {
    const roomName = data.room in rooms ? data.room : 'Poczekalnia';

    const timeDifference = now - (data.time || Date.parse('0'));
    if (timeDifference <= 3600000 || data.gameRoom) {
      if (data.gameRoom) {
        if (!rooms[roomName]['groups'][data.gameRoom]) rooms[roomName]['groups'][data.gameRoom] = {};
        rooms[roomName]['groups'][data.gameRoom][name] = data;
      }
      else {
        rooms[roomName]['onlinePlayers'][name] = data;
      }
    } else {
      rooms[roomName]['offlinePlayers'][name] = data;
    }
  });

  const formatTimeDifference = (timestamp?: number): string => {
    const diff = Date.now() - (timestamp || Date.parse('0'));
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 5) return '';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const [offlineOpenRooms, setOfflineOpenRooms] = useState<{ [room: string]: boolean }>({});

  const toggleOffline = (room: string) => {
    setOfflineOpenRooms((prev) => ({ ...prev, [room]: !prev[room] }));
  };

  const roomTitle = (room: string, players: Players) => {
    const colors = Object.values(players).map(p => p.colorRgba);
    const distinctColors = (new Set(colors)).size == colors.length;
    return (
      <div className="room-title">
        <h2 className={room == players[userName!]?.room ? "room-name my-player" : "room-name"}>{room}</h2>
        {/* Przyciski akcji */}
        {room !== players[userName!]?.room ? (
          <button className="room-button" onClick={() => joinRoom(room)}>
            Dołącz
          </button>
        ) : ['Monopoly'].includes(room) ? (
          <button className="room-button" disabled={!distinctColors}
            onClick={() => startRoom(room, players)}
            style={{ pointerEvents: distinctColors ? 'auto' : 'none' }}>
            {distinctColors ? 'Rozpocznij' : 'Musicie mieć różne kolory'}
          </button>
        ) : !['Poczekalnia', null, '', undefined].includes(room) ? (
          <button className="room-button" disabled={!distinctColors} style={{ pointerEvents: 'none' }}>
            Brak wspracia webowego
          </button>
        ) : null}
      </div>
    )
  };

  const playerList = (players: Players) => (
    <ul className="player-list">
      {Object.entries(players).map(([name, data]: [string, PlayerData]) => (
        <li key={name} className="player-item">
          {name == userName ? (<>
            <button className="player-color-button" tabIndex={-1} style={{
              backgroundColor: data.colorRgba,
              pointerEvents: 'auto'
            }} onClick={() => togglePlayerColor(name, data)} />
            <span className={"player-name my-player"}>{name}</span>
          </>) : (<>
            <button className="player-color-button" tabIndex={-1} style={{
              backgroundColor: data.colorRgba,
              pointerEvents: 'none'
            }} />
            <span className={"player-name"}>{name}</span>
          </>)}
          <span className="player-time">{formatTimeDifference(data.time)}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="container">
      {sortedRooms.map((room) => {
        const { groups, onlinePlayers, offlinePlayers } = rooms[room];

        return (
          <div key={room} className="room-container">
            {roomTitle(room, onlinePlayers)}

            {Object.keys(onlinePlayers).length > 0 ? <h3>Gracze online ({Object.keys(onlinePlayers).length})</h3> : null}
            {playerList(onlinePlayers)}

            {Object.keys(groups).length > 0 ? (<h3>Bierzące rozgrywki:</h3>) : null}
            {Object.entries(groups).map(([gameRoom, players]) => (
              <div key={gameRoom} className="game-room-container">
                <h4 className="game-room-title">
                  <span className="game-room-name">#{gameRoom}</span>
                  {['Monopoly'].includes(room)
                    ? <button className="game-room-button" onClick={() => watchRoom(room, gameRoom)}>Obserwuj</button>
                    : null}
                </h4>
                {playerList(players)}
              </div>
            ))}

            {/* Zakładka offline*/}
            {Object.keys(offlinePlayers).length > 0 && (
              <div className="offline-toggle">
                <h3 onClick={() => toggleOffline(room)}>
                  {offlineOpenRooms[room] ? '▼' : '▶'} Gracze offline ({Object.keys(offlinePlayers).length})
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