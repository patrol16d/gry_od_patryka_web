import { useEffect, useContext, useState } from 'react';
import { UserContext } from '../../user/UserContext';
import { onValue } from '../../firebase';
import { MonopolyModel } from '../models/game';
import { parseFieldsFromJson } from '../models/field';
import { PlayerModel } from '../models/player';

interface MonopolyRTVProps {
    gameRoom: string;
}

interface PlayersModel {
    round: string;
    players: { [name: string]: PlayerModel };
    playersOrder: string[],
    observers: string[],
}

const MonopolyRTV: React.FC<MonopolyRTVProps> = ({ gameRoom }: { gameRoom: string }) => {
    const { userName } = useContext(UserContext);
    const [gameModel, setGameModel] = useState<MonopolyModel | null>(null);

    useEffect(() => {
        const unsubscribe = onValue(`/games/rooms/${gameRoom}`, (snapshot) => {
            const data = snapshot.val();
            if (data == null) {
                setGameModel(data);
            } else {
                const playersModel: PlayersModel = {
                    players: Object.entries(data['playersModel']['players'] as { [key: string]: { [key: string]: any } })
                        .reduce((map: { [name: string]: PlayerModel }, [name, player]) => {
                            map[name] = new PlayerModel(
                                name,
                                player['position'] ?? 0,
                                player['colorIndex'] ?? 0,
                                player['money'] ?? 0,
                                player['inJailFor'] ?? 0,
                            );
                            return map;
                        }, {}),
                    playersOrder: data['playersModel']['playersOrder'],
                    round: data['playersModel']['round'],
                    observers: Object.keys(data['playersModel']['observers'] ?? {}),
                }
                const gameModel = data['gameModel'];

                console.debug(playersModel);

                setGameModel(new MonopolyModel(
                    playersModel.players,
                    playersModel.playersOrder,
                    playersModel.observers,
                    playersModel.round,
                    parseFieldsFromJson(gameModel['fields'], playersModel.players),
                    gameModel['waitingToThrow'],
                    gameModel['canTakeStart'],
                    gameModel['haveToPay'] ?? {},
                    gameModel['waitingToBuy'],
                    gameModel['cardsRandomSeed'],
                    gameModel['chanceCardsIndex'],
                    gameModel['socialFundCardsIndex'],
                    gameModel['canPay'] ?? null,
                    gameModel['auction'] ?? null,
                ));
            }

        });
        return () => {
            unsubscribe();
        };
    }, []);

    if (gameModel == null) return (<>Ładowanie...</>);

    return (
        <>
            {userName}
            <pre style={{ textAlign: 'left' }}> {JSON.stringify(gameModel, null, '\t')} </pre>
        </>
    );
};

export default MonopolyRTV;
