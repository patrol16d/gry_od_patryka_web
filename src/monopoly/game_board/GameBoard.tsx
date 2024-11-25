import { CSSProperties } from 'react';
import { home, hotel } from '../../assets/Icons';
import { Field } from '../models/field';
import { MonopolyModel } from '../models/game';
import InfiniteLoopingList from './InfiniteLoopingList';

const GameBoard: React.FC<{ gameModel: MonopolyModel, exit: () => void }> = ({ gameModel, exit }) => {
    const genereteButtons = () => {
        const newPrice = (gameModel.auction?.value ?? 0) +
            Math.max(10, ((gameModel.auction?.value ?? 0) / 100) * 10);

        const sisabledStyle: CSSProperties = {
            pointerEvents: 'none',
        }

        if (gameModel.haveToPay.length > 0) {
            if (Object.keys(gameModel.haveToPay).includes(gameModel.nick)) {
                const disabled = gameModel.players[gameModel.nick].money < gameModel.haveToPay[gameModel.nick]!;
                return (<button disabled={disabled} style={{ ...(disabled ? sisabledStyle : {}), margin: '0 auto' }} onClick={disabled ? () => { } : gameModel.pay}>
                    Zapłać ({gameModel.haveToPay[gameModel.nick]})
                </button>)
            }
        } else if (gameModel.waitingToThrow) {
            return (<button onClick={gameModel.throwDices} style={{ margin: '0 auto' }}>
                Rzuć kośćmi
            </button>)
        } else if (gameModel.waitingToBuy || gameModel.auction != null) {
            const curAuctionPlayer = gameModel.auction?.players[gameModel.auction?.round].name ?? '';

            const disabled = !gameModel.playersOrder.some((p) => gameModel.players[p]!.inJailFor == 0 && p != gameModel.nick)
            const disabled2 = gameModel.players[gameModel.round].money < gameModel.fields[gameModel.players[gameModel.round].position].cost;
            const disabled3 = newPrice > gameModel.players[curAuctionPlayer]?.money;

            return (<div style={{
                margin: '0 auto',
                width: '60%',
            }}>
                <div style={{
                    background: 'linear-gradient(180deg, rgba(33, 140, 183, 1) 0%, rgba(33, 139, 183,1) 50%, rgba(33, 149, 183,1) 140%)',
                    boxShadow: '0 0 5px 1px rgba(87, 174, 245, 0.8)',
                    marginBottom: 5,
                    fontSize: 'smaller',
                }}>
                    <div style={{ display: 'flex' }}>
                        <div style={{ fontWeight: 'bold' }}>Do kupienia</div>
                        <div style={{ marginLeft: 'auto' }}>Cena bazowa</div>
                    </div>
                    <div>
                        <div style={{ display: 'flex' }}>
                            <div style={{ fontWeight: 'bold' }}>{gameModel.fields[gameModel.players[gameModel.round].position].name}</div>
                            <div style={{ marginLeft: 'auto' }}>{gameModel.fields[gameModel.players[gameModel.round].position].cost}</div>
                        </div>

                        {gameModel.auction == null ? (
                            <div style={{ height: 5 }}></div>
                        ) : gameModel.auction!.players.map((p) => (
                            <div key={p.name} style={{ display: 'flex' }}>
                                <div key={p.name} style={{
                                    textDecoration: !p.isPlaying ? 'line-through' : 'none',
                                }}>{p.name}</div>
                                <div style={{ marginLeft: 'auto' }}>
                                    {p.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {
                    gameModel.auction == null && gameModel.waitingToBuy ? (
                        <div style={{ display: 'flex' }}>
                            <button disabled={disabled} style={disabled ? sisabledStyle : {}} onClick={disabled ? () => { } : gameModel.throwOnAuction}>
                                Wrzuć na licytację
                            </button>
                            <button disabled={disabled2} style={{ ...(disabled2 ? sisabledStyle : {}), marginLeft: 'auto' }} onClick={disabled2 ? () => { } : gameModel.buy}>
                                Kup
                            </button>
                        </div>
                    ) : curAuctionPlayer == gameModel.nick ? (
                        <div style={{ display: 'flex' }}>
                            <button onClick={gameModel.pass}>
                                Pasuj
                            </button>
                            <button disabled={disabled3} style={{ ...(disabled3 ? sisabledStyle : {}), marginLeft: 'auto' }} onClick={disabled3 ? () => { } :
                                gameModel.auction!.players.filter(p => p.isPlaying).length < 2
                                    ? gameModel.buy
                                    : () => gameModel.raiceBet(newPrice)
                            }>
                                {gameModel.auction!.players.filter(p => p.isPlaying).length < 2
                                    ? 'Kup'
                                    : `Licytuj (${newPrice})`
                                }
                            </button>
                        </div>
                    ) : curAuctionPlayer != '' ? (
                        <div style={{ textAlign: 'center', background: 'rgba(33, 149, 183,0.4)' }}>
                            Oczekiwanie na gracza {gameModel.players[curAuctionPlayer].nick}
                        </div>
                    ) : null
                }
            </div >)
        } else if (gameModel.round == gameModel.nick) {
            return (<button onClick={() => gameModel.nextRound()}>
                Zakończ kolejkę
            </button>)
        }
    };

    const generetePlayerBox = (playerName: string) => (
        <div
            key={playerName}
            style={{
                width: '20px',
                height: '20px',
                margin: '2px',
                background: gameModel.players[playerName].colorRgba,
                boxShadow: playerName == gameModel.nick
                    ? '0 0 5px 1px black'
                    : '',
            }}
        />
    )

    const generateField = (field: Field, index: number) => (
        <div key={index} style={{
            padding: '10px',
            border: '1px solid ' + (field.isOff ? '#844' : '#ccc'),
            marginBottom: '10px',
            display: 'flex',
            flexWrap: 'wrap',
            background: field.players.includes(gameModel.round)
                ? 'linear-gradient(180deg, rgba(41,43,153,1) 0%, rgba(0,123,255,0.4) 100%)'
                : 'rgba(0,123,255,0.1)'
        }}>
            <div style={{
                display: 'flex',
                width: '100%',
            }}>
                <div style={{
                    boxShadow: field.player != ''
                        ? '0 0 5px 1px ' + gameModel.players[field.player].colorRgba
                        : '',
                    background: field.streetColorRgba,
                    textShadow: '1px 1px 2px black',
                    display: 'flex',
                    padding: '5px',
                    flexDirection: 'column',
                    alignItems: 'flexStart',
                }}>
                    <h4 style={{ margin: 0, }}>
                        {field.name}
                    </h4>
                    {field.type == 'start' && gameModel.canTakeStart ? (
                        <button onClick={gameModel.takeStart} style={{
                            padding: '0 10px',
                            background: 'none',
                            fontWeight: 'bold',
                        }}>
                            {field.description}
                        </button>
                    ) : (
                        <span style={{ fontSize: 'smaller' }}>
                            {field.description}
                        </span>
                    )}


                </div>

                <div style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    maxWidth: '60px',
                    flexWrap: 'wrap',
                    paddingLeft: 5,
                }}>
                    {field.players.map(generetePlayerBox)}
                </div>
            </div>

            {field.type != 'street' && field.buildingCount > 0 ? null : (
                <div style={{
                    display: 'flex',
                    alignItems: 'flexStart',
                    flexWrap: 'wrap',
                    marginTop: '5px',
                }}>
                    {field.buildingCount > 4
                        ? hotel({
                            color: gameModel.players[field.player]?.colorRgba ?? 'white',
                            display: 'flex',
                            width: '50px',
                            height: '50px',
                        })
                        : Array
                            .from({ length: field.buildingCount }, (_, k) => k + 1)
                            .map(i => home({
                                color: gameModel.players[field.player]?.colorRgba ?? 'white',
                                key: `${index}-${i}`,
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                            }))
                    }
                </div>
            )}
        </div>
    );

    const players = () => (
        <div style={{
            borderBottom: '1px solid gray',
        }}>
            <div style={{
                display: 'flex',
                margin: '0 5px'
            }}>
                <h4 style={{ margin: '0' }}>Gracze</h4>
                <div style={{ marginLeft: 'auto' }}>Runda</div>
            </div>
            {gameModel.playersOrder.map(p => (
                <div key={p} style={{
                    display: 'flex',
                    margin: 5,
                    textDecoration: gameModel.nick == p ? 'underline' : 'none',
                }}>
                    {p}
                    <div style={{ marginLeft: 'auto' }}>
                        {generetePlayerBox(p)}
                    </div>

                    <div style={{
                        width: '50px',
                        position: 'relative',
                    }}>
                        <div style={{
                            fontSize: 30,
                            right: 10,
                            top: -13,
                            position: 'absolute',
                        }}>
                            {gameModel.round == p ? '←' : ''}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const observers = () => gameModel.observers.length == 0 ? null : (
        <div style={{
            borderBottom: '1px solid gray',
        }}>
            <h5 style={{ margin: '2px 5px 0 5px' }}>Obserwatorzy</h5>
            {gameModel.observers.map(p => (
                <div key={p} style={{
                    display: 'flex',
                    margin: '0 5px 5px 5px',
                    textDecoration: gameModel.nick == p ? 'underline' : 'none',
                }}>
                    {p}
                </div>
            ))}
        </div>
    );

    const history = () => {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
            }}>
                <h4 style={{ margin: '0 5px' }}>Historia</h4>
                <div style={{
                    overflow: 'auto',
                    flex: 1,
                    padding: '0 15px 0 5px',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {...Object.entries(gameModel.history).reverse().map(e => (
                        <div style={{
                            margin: '3px 0px',
                            borderRadius: 6,
                            background: `linear-gradient(180deg, ${gameModel.players[e[1].split('|')[0]]?.colorRgba2 ?? '#557ba7'} 0%, rgba(0,0,0,0) 200%)`,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0 3px'
                        }}>
                            <div>{e[1].split('|')[1].split('`').map((val, index) => (
                                <span key={index} style={{
                                    display: (index % 2) ? 'inline-block' : '',
                                    background: (index % 2)
                                        ? gameModel.fields.find(f => f.name == val)?.streetColorRgba
                                        : '',
                                    boxShadow: (index % 2) ? '0 0 5px 1px black' : '',
                                }}>{val}</span>
                            ))}</div>
                            <div style={{
                                marginLeft: 'auto',
                                fontSize: 'smaller',
                            }}>{new Date(parseInt(e[0].split('-')[0]) + 3600000).toISOString().split('.')[0].split('T').reverse().join(' ')}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <div style={{
                height: '100%',
                position: 'absolute',
                padding: '59px 0 0 0', // width of next div
                display: 'flex',
                width: '100%',
                maxWidth: '900px',
                left: '50%',
                transform: 'translateX(-50%)',
            }}>
                <div style={{
                    height: '100%',
                    width: '100%',
                }}>
                    <InfiniteLoopingList
                        items={gameModel.fields}
                        generateField={generateField}
                        generetePlayerBox={generetePlayerBox}
                        genereteButtons={genereteButtons}
                    />
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '50%',
                    height: '100%',
                    borderLeft: '1px solid gray',
                }}>
                    {players()}
                    {observers()}
                    {history()}
                </div>
            </div>

            <div style={{
                width: '100%',
                display: 'flex',
                padding: 10,
                borderBottom: '1px solid gray',
                position: 'absolute',
            }}>
                <h3 style={{ margin: 5 }}>
                    {gameModel.playersOrder.includes(gameModel.nick)
                        ? (<>Pieniądze : {gameModel.players[gameModel.nick].money}</>)
                        : null
                    }
                </h3>

                <button onClick={exit} style={{
                    marginLeft: 'auto',
                    padding: '5px 10px'
                }}>
                    Wyjdź
                </button>
            </div>
        </>
    );
};

export default GameBoard;
