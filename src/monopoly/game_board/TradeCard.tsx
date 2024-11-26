import { useState } from "react";
import { MonopolyModel } from "../models/game";
import { Trade } from "../models/trade";

interface TradeCardRef {
    trade: Trade;
    gameModel: MonopolyModel,
    isNew: boolean,
    turnOffAction: () => void,
}

const TradeCard: React.FC<TradeCardRef> = ({ trade, gameModel, isNew, turnOffAction }) => {
    const [showAddField, setShowAddField] = useState(false);
    const [addingMyField, setAddingMyField] = useState(true);

    const fieldTile = (f: number) => {
        const field = gameModel.fields[f];
        return (
            <div style={{ background: field.streetColorRgba }}>
                <div>
                    <div>{field.name}</div>
                    <div>Cena bazowa: {field.cost}</div>
                </div>
                <div>{field.buildingCount}</div>
            </div>
        )
    }

    return (
        <div style={{
            borderRadius: 10,
            border: `3px solid '#494'`,
            boxShadow: `0 0 5px 3px #464, 0 0 5px 4px black`,
            background: '#464',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 10,
        }}>
            <h3 style={{
                margin: ' 0 0 10px 0',
                textShadow: '1px 1px 2px black',
                padding: '15px',
                borderBottom: '3px solid #242',
            }}>
                {showAddField
                    ? addingMyField ? 'Dodaj swoje działki' : `Dodaj działki ${trade.oponent}`
                    : isNew ? 'Nowa oferta wymiany' : 'Oferta wymiany'
                }

                {!showAddField && !isNew ? <button onClick={() => gameModel.deleteTrade(trade)}>Usuń</button> : null}
            </h3>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
            }}>

                {showAddField ? gameModel.fields.filter((f) => f.player == (addingMyField ? gameModel.nick : trade.oponent)).map((f) => {
                    const fIndex = gameModel.fields.indexOf(f);
                    const isIn = (addingMyField ? trade.myFields : trade.oponentFields).includes(fIndex);
                    return (<button key={f.index} onClick={() => {
                        isIn
                            ? addingMyField
                                ? trade.myFields = trade.myFields.filter(f => f != fIndex)
                                : trade.oponentFields = trade.oponentFields.filter(f => f != fIndex)
                            : addingMyField
                                ? trade.myFields.push(fIndex)
                                : trade.oponentFields.push(fIndex);
                        if (!isNew) {
                            gameModel.updateTrade(trade);
                        }
                    }} style={{ background: f.streetColorRgba }}>
                        <div>
                            <div>{f.name}</div>
                            <div>Cena bazowa: {f.cost}</div>
                        </div>
                        <div>{f.buildingCount}</div>
                        {isIn ? 'OK' : null}
                    </button>);
                }) : (
                    <div>
                        <div style={{ fontSize: 'smaller' }}>Twoje działki:</div>
                        {trade.myFields.map(fieldTile)}
                        {gameModel.fields.every((f) => f.player != gameModel.nick)
                            ? <div>Brak działek na wymianę</div>
                            : trade.accepted ? <button>
                                Dodaj działkę
                            </button> : null}

                        {trade.accepted ? <div>Zaakceptowano</div> : null}

                        <div>Kasa</div>

                        <div>Przeciwnik:</div>
                        {trade.oponent != '' ? <div>{trade.oponent}</div> : null}

                        {trade.oponentAccepted ? <div>Zaakceptowano</div> : null}

                        {trade.oponentFields.map(fieldTile)}

                        {gameModel.fields.every((f) => f.player != trade.oponent)
                            ? <div>Brak działek na wymianę</div>
                            : trade.accepted
                                ? trade.oponent == ''
                                    ? <>
                                        <div>Wybierz przeciwnika</div>
                                        {gameModel.playersOrder
                                            .filter((p) => p != gameModel.nick)
                                            .map((p) => <button key={p} onClick={() => trade.oponent = p}>{p}</button>)
                                        }
                                    </>
                                    : <button onClick={() => { setShowAddField(true); setAddingMyField(false); }}>Dodaj działkę</button>
                                : null}
                    </div>
                )}

                {showAddField
                    ? <button onClick={() => setShowAddField(false)}>Gotowe</button>
                    : isNew ? (
                        <button disabled={!(trade.oponent != '' && (trade.money != 0 || trade.myFields.length > 0 || trade.oponentFields.length > 0))}
                            style={{ pointerEvents: (trade.oponent != '' && (trade.money != 0 || trade.myFields.length > 0 || trade.oponentFields.length > 0)) ? 'auto' : 'none' }}
                            onClick={() => {
                                gameModel.postTrade(trade);
                                turnOffAction();
                            }}>
                            Udostępnij ofertę
                        </button>
                    ) : (
                        <button onClick={() => {
                            trade.accepted = !trade.accepted;
                            gameModel.updateTrade(trade);
                        }}>
                            {trade.accepted ? 'Anuluj akceptację' : 'Akceptuj'}
                        </button>
                    )}
            </div>
        </div >
    );
}

export default TradeCard;