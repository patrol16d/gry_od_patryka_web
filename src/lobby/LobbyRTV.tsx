// RealTimeValue.js
import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../user/UserContext.tsx';
import { set, update, onValue } from '../firebase.ts';
import RoomList from './RoomList.tsx';
import { colorToRgba, fieldsTemplate, parseFieldsToJson } from '../monopoly/models/field.ts';
import { playersColors } from '../monopoly/models/player.ts';

export class PlayerData {
  private constructor(
    public room: string = 'Poczekalnia',
    public monopolyColor: number,
    public cluedoColor: number,
    public color: number,
    public time: number,
    public version: string,
    public gameRoom: string | null,
  ) { }

  static fromJson = (data: { [key: string]: any }) => {
    return new PlayerData(
      data['room'] || 'Poczekalnia',
      data['monopolyColor'] || 0,
      data['cluedoColor'] || 0,
      data['color'] || 0,
      data['time'] || 0,
      data['version'] || '',
      data['gameRoom'] || null,
    );
  }

  get colorRgba() {
    if (this.room == 'Monopoly') {
      const color = playersColors[this.monopolyColor ?? 0];
      return colorToRgba(color);
    }

    return colorToRgba([0, 0, 0, 0])
  }
}

export interface Players {
  [name: string]: PlayerData
}


const LobbyRTV: React.FC = () => {
  const { userName } = useContext(UserContext);
  const [value, setValue] = useState(null);

  useEffect(() => {
    const unsubscribe = onValue('/lobby', (snapshot) => {
      const data = snapshot.val();
      setValue(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (value == null) return (<>Ładowanie...</>);

  const joinRoom = (room: string) => {
    set(`/lobby/players/${userName}/room`, room);
  }

  const startRoom = (room: string, players: Players) => {
    const gameRoomKey = `${Date.now()}`;
    const updateMap: { [key: string]: string } = {};
    Object.keys(players).forEach(p => {
      updateMap[`/lobby/players/${p}/gameRoom`] = gameRoomKey;
    });
    updateMap[`games/rooms/${gameRoomKey}/name`] = room;

    const settings = value['rooms'][room];

    if (room == 'Monopoly') startMonopoly(gameRoomKey, settings, updateMap, players);
  }

  const watchRoom = (room: string, gameRoom: string) => {
    update('/', {
      [`/lobby/players/${userName}/room`]: room,
      [`/lobby/players/${userName}/gameRoom`]: gameRoom,
      [`/games/rooms/${gameRoom}/playersModel/observers/${userName}`]: 1
    });
  }

  return (
    <RoomList roomsList={Object.keys(value['rooms'])}
      players={
        Object.entries(value['players']).reduce((map: Players, [name, player]) => {
          map[name] = PlayerData.fromJson(player as { [key: string]: any });
          return map
        }, {})
      }
      joinRoom={joinRoom}
      startRoom={startRoom}
      watchRoom={watchRoom}
    />
  );
};

export default LobbyRTV;

function startMonopoly(gameRoomKey: string, settings: { robots: number }, updateMap: { [key: string]: any; }, players: Players) {
  const colors = Array.from({ length: playersColors.length }, (_, k) => k + 1);

  const playersMap = Object.keys(players).reduce((map: { [name: string]: { [name: string]: number } }, obj) => {
    const color = players[obj].monopolyColor ?? 0;
    colors.splice(colors.indexOf(color), 1);
    map[obj] = {
      'color': color,
      'position': 0,
      'money': 1500,
    };
    return map;
  }, {});

  if (settings.robots == 1) {
    playersMap['Robot'] = {
      'color': colors.pop()!,
      'position': 0,
      'money': 1500,
    };
  } else {
    for (let i = 0; i < settings.robots; i++) {
      playersMap[`Robot ${i}`] = {
        'color': colors.pop()!,
        'position': 0,
        'money': 1500,
      };
    }
  }

  const playersOrder = Object.keys(playersMap)
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  updateMap[`games/rooms/${gameRoomKey}/gameModel/cardsRandomSeed`] = Math.floor(Math.random() * 1000000);
  updateMap[`games/rooms/${gameRoomKey}/gameModel/waitingToThrow`] = true;
  updateMap[`games/rooms/${gameRoomKey}/gameModel/fields`] =
    parseFieldsToJson(fieldsTemplate());
  updateMap[`games/rooms/${gameRoomKey}/playersModel/players`] = playersMap;
  updateMap[`games/rooms/${gameRoomKey}/playersModel/playersOrder`] = playersOrder;
  updateMap[`games/rooms/${gameRoomKey}/playersModel/round`] =
    playersOrder.find((e) => !e.startsWith('Robot'));
  update(`/`, updateMap);
}

