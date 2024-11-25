import { useEffect, useContext, useState } from 'react';
import { UserContext } from '../../user/UserContext';
import { onValue, update } from '../../firebase';
import { MonopolyModel } from '../models/game';
import GameBoard from './GameBoard';


const MonopolyRTV: React.FC<{ gameRoom: string }> = ({ gameRoom }) => {
    const { userName } = useContext(UserContext);
    const [gameModel, setGameModel] = useState<MonopolyModel | null>(null);

    const exit = () => {
        const updateMap: { [key: string]: any } = {
            [`/lobby/players/${userName}/gameRoom`]: null,

        };

        if (gameModel!.playersOrder.includes(userName!)) {
            const newOrder = gameModel!.playersOrder.filter(p => p != userName);
            if (newOrder.length > 0) {
                updateMap[`/games/rooms/${gameRoom}/playersModel/playersOrder/`] = newOrder;
            }
            else {
                updateMap[`/games/rooms/${gameRoom}`] = null;
            }
        } else {
            updateMap[`/games/rooms/${gameRoom}/playersModel/observers/${userName}`] = null;
        }

        update('/', updateMap);
    }

    useEffect(() => {
        const unsubscribe = onValue(`/games/rooms/${gameRoom}`, (snapshot) => {
            const data = snapshot.val();
            if (data == null) {
                // console.log('data == null');
                setGameModel(data);
            } else {
                setGameModel(MonopolyModel.fromJson(data, gameRoom, userName!));
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    if (gameModel == null) return (<>Ładowanie...</>);
    // console.log(gameModel);
    return (
        <GameBoard gameModel={gameModel} exit={exit} />
        // <>
        //     <pre style={{ textAlign: 'left' }}> {JSON.stringify(gameModel, null, '\t')} </pre>
        // </>
    );
};

export default MonopolyRTV;
