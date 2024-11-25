import { AuctionModel } from "./auction";
import { shuffleWithSeed, chanceCards, socialFundCards } from "./card";
import { Field, parseFieldsFromJson } from "./field";
import { HistoryWriter } from "./historyWriter";
import { PlayerModel } from "./player"

export class MonopolyModel {
    private constructor(
        public gameRoom: string,
        public nick: string,
        public players: { [name: string]: PlayerModel },
        public playersOrder: string[],
        public observers: string[],
        public round: string,
        public fields: Field[],
        public waitingToThrow: boolean,
        public canTakeStart: boolean,
        public haveToPay: { [name: string]: number },
        public waitingToBuy: boolean,
        public cardsRandomSeed: number,
        public chanceCardsIndex: number,
        public socialFundCardsIndex: number,
        public canPay: string | null,
        public auction: AuctionModel | null,
        public history: { [key: string]: string },
    ) { }

    public get myPlayer() { return this.players[this.nick]; }
    public get myField() { return this.fields[this.myPlayer.position]; }
    public get currPlayer() { return this.players[this.round]; }
    public get currField() { return this.fields[this.currPlayer.position]; }

    static fromJson = (data: any, gameRoom: string, userName: string) => {
        const players = Object
            .entries(data['playersModel']['players'] as { [key: string]: { [key: string]: any } })
            .reduce((map: { [name: string]: PlayerModel }, [name, player]) => {
                map[name] = new PlayerModel(
                    name,
                    player['position'] ?? 0,
                    player['color'] ?? 0,
                    player['money'] ?? 0,
                    player['inJailFor'] ?? 0,
                );
                return map;
            }, {});

        return new MonopolyModel(
            gameRoom,
            userName,
            players,
            data['playersModel']['playersOrder'] ?? [],
            Object.keys(data['playersModel']['observers'] ?? {}),
            data['playersModel']['round'],
            parseFieldsFromJson(data['gameModel']['fields'], players, data['playersModel']['playersOrder'] ?? []),
            data['gameModel']['waitingToThrow'] && data['playersModel']['round'] == userName,
            data['gameModel']['canTakeStart'] && data['playersModel']['round'] == userName,
            data['gameModel']['haveToPay'] ?? {},
            data['gameModel']['waitingToBuy'] && data['playersModel']['round'] == userName,
            data['gameModel']['cardsRandomSeed'],
            data['gameModel']['chanceCardsIndex'],
            data['gameModel']['socialFundCardsIndex'],
            data['gameModel']['canPay'] ?? null,
            AuctionModel.fromJson(data['gameModel']['auction'] ?? null),
            data['history'] ?? {},
        );
    }

    public throwDices = async () => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        let dice1 = Math.floor(Math.random() * 6) + 1;
        let dice2 = Math.floor(Math.random() * 6) + 1;
        let sum = dice1 + dice2;
        if (dice1 == dice2) {
            historyWriter.add(`${this.nick} rzucił (${dice1},${dice2})`);
            dice1 = Math.floor(Math.random() * 6) + 1;
            dice2 = Math.floor(Math.random() * 6) + 1;
            sum = dice1 + dice2;
            if (dice1 == dice2) {
                historyWriter.add(`${this.nick} rzucił (${dice1},${dice2})`);
                dice1 = Math.floor(Math.random() * 6) + 1;
                dice2 = Math.floor(Math.random() * 6) + 1;
                sum = dice1 + dice2;
            }
        }

        const nextPos = (this.currPlayer.position + sum) % this.fields.length;

        let nextField = this.fields[nextPos];

        if (dice1 == dice2) {
            historyWriter.add(`${this.nick} rzucił (${dice1},${dice2}) i idzie do więzienia`);
            await this.goToJail(historyWriter);
            return;
        }

        if (nextField.type == 'goToJail') {
            historyWriter.add(`${this.nick} rzucił (${dice1},${dice2}) i trafił na policjanta - idzie do więzienia`);
            await this.goToJail(historyWriter);
            return;
        }

        const update: { [key: string]: any } = {
            'gameModel/waitingToThrow': false,
            'gameModel/waitingToBuy': false,
            'gameModel/haveToPay': null,
            'gameModel/canPay': null,
            [`playersModel/players/${this.round}/position`]: nextPos,
        };

        historyWriter.add(`${this.nick} rzucił (${dice1},${dice2}) i ustał na \`${nextField.name}\``);

        update['gameModel/canTakeStart'] = nextPos < this.currPlayer.position || sum >= this.fields.length;

        if (nextField.type == 'card') {
            const card = nextField.name == 'Szansa'
                ? shuffleWithSeed(this.cardsRandomSeed, chanceCards)[this.chanceCardsIndex]
                : shuffleWithSeed(this.cardsRandomSeed, socialFundCards)[this.socialFundCardsIndex];
            if (nextField.name == 'Szansa') {
                update['gameModel/chanceCardsIndex'] =
                    (this.chanceCardsIndex + 1) % chanceCards.length;
            } else {
                update['gameModel/socialFundCardsIndex'] = (this.socialFundCardsIndex + 1) % socialFundCards.length;
            }

            if (card.type == 'move') {
                if (this.fields[card.position].type == 'goToJail') {
                    historyWriter.add(`${this.nick} dobrał kartę 'Idziesz do więzienia'`);
                    update['gameModel/canTakeStart'] = false;
                    await this.goToJail(historyWriter);
                    return;
                }
                historyWriter.add(`${this.nick} dobrał kartę 'Idziesz na \`${this.fields[card.position].name}\`'`);

                update['gameModel/canTakeStart'] = update['gameModel/canTakeStart'] || card.position < nextPos;
                update[`playersModel/players/${this.round}/position`] = card.position;
                nextField = this.fields[card.position];
            } else if (card.type == 'pay') {
                // update.remove('gameModel/haveToPay');
                update['gameModel/haveToPay'] = { nick: card.cost };
                historyWriter.add(`${this.nick} dobrał kartę 'Zapłać ${card.cost}'`);
            } else if (card.type == 'take') {
                update[`playersModel/players/${this.round}/money`] = this.myPlayer.money + card.cost;
                historyWriter.add(`${this.nick} dobrał kartę 'Dostajesz ${card.cost}'`);
            } else if (card.type == 'payForBuildings') {
                const cost = this.fields
                    .filter((f) => f.player == this.nick && f.type == 'street')
                    .reduce((p, f) => p + f.buildingCount * f.buildingCost, 0);
                update['gameModel/haveToPay'] = { nick: cost };
                historyWriter.add(`${this.nick} dobrał kartę 'Zapłać ${card.cost} za każdy dom i ${card.hotelCost} za każdy hotel - razem ${cost}`);
            } else if (card.type == 'birthday') {
                this.playersOrder.filter((p) => p != this.nick).forEach(p => {
                    update[`gameModel/haveToPay/${p}`] = card.cost
                });

                historyWriter.add(`${this.nick} dobrał kartę 'Masz urodziny gracze składają się dla Ciebie po ${card.cost}'`);
            }
        }

        console.log('throwDices', nextField);

        if (nextField.type == 'payment') {
            update['gameModel/haveToPay'] = { nick: nextField.cost };
        } else if (nextField.canBeBought) {
            update['gameModel/waitingToBuy'] = true;
        } else if (['street', 'trainStop', 'infrastructure'].includes(nextField.type) &&
            nextField.player != '' &&
            nextField.player != this.nick) {
            update['gameModel/canPay'] = this.nick;
        } else if (nextField.type == 'parking' && nextField.buildingCount > 0) {
            update[`gameModel/fields/${this.fields.indexOf(nextField)}`] = '|0';
            update[`playersModel/players/${this.nick}/money`] = this.myPlayer.money + nextField.buildingCount;

            historyWriter.add(`${this.nick} zebrał z parkingu \`${nextField.buildingCount}\``);
        }

        await historyWriter.commit(update);
    }

    public goToJail = async (historyWriter: HistoryWriter) => {
        await this.nextRound(historyWriter, {
            [`playersModel/players/${this.nick}/position`]: ([...this.fields, ...this.fields]).indexOf(
                this.fields.find(f => f.type == 'jail')!, this.myPlayer.position
            ) % this.fields.length,
            [`playersModel/players/${this.nick}/inJailFor`]: 3,
        });
    }

    public nextRound = async (historyWriter?: HistoryWriter, update?: { [key: string]: any }) => {
        let nextPlayer = this.playersOrder[(this.playersOrder.indexOf(this.round) + 1) % this.playersOrder.length];
        historyWriter ??= new HistoryWriter(this.nick, this.gameRoom);

        update ??= {
            'gameModel/waitingToThrow': true,
            'gameModel/waitingToBuy': false,
            'gameModel/canTakeStart': false,
            'gameModel/haveToPay': null,
            'gameModel/auction': null,
        };

        while (this.players[nextPlayer]!.inJailFor > 0) {
            this.players[nextPlayer]!.inJailFor--;
            historyWriter.add(
                `${nextPlayer} czeka ${3 - this.players[nextPlayer]!.inJailFor} kolejkę w więziueniu`,
                nextPlayer,
            );

            update[`playersModel/players/${nextPlayer}/inJailFor`] = this.players[nextPlayer]!.inJailFor;

            nextPlayer = this.playersOrder[(this.playersOrder.indexOf(nextPlayer) + 1) % this.playersOrder.length];
        }
        historyWriter.add(`${nextPlayer} rozpoczyna rundę`, nextPlayer);

        update['playersModel/round'] = nextPlayer;

        await historyWriter.commit(update);
    }

    public throwOnAuction = async () => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        historyWriter.add(`${this.nick} rozpoczął licytację o \`${this.fields[this.currPlayer.position].name}\``);

        const halfCost = this.fields[this.currPlayer.position].cost / 2;

        await historyWriter.commit({
            'gameModel/auction/players': this.playersOrder.map((p) => p == this.round
                ? `${p}|${halfCost}|${this.currPlayer.money < halfCost ? 0 : 1}`
                : `${p}|0|${this.players[p]!.inJailFor == 0 ? 1 : 0}`),
            'gameModel/auction/round': (this.playersOrder.indexOf(this.round) + 1) % this.playersOrder.length,
        });
    }

    public raiceBet = async (price: number) => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        historyWriter.add(`${this.nick} podpibł cenę do ${price}`);

        let round = (this.auction!.round + 1) % this.auction!.players.length;
        while (!this.auction!.players[round].isPlaying) round = (round + 1) % this.auction!.players.length;

        await historyWriter.commit({
            [`gameModel/auction/players/${this.auction!.round}`]: `${this.nick}|${price}|1`,
            [`gameModel/auction/round`]: round,
        });
    }

    public buy = async () => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        historyWriter.add(
            `${this.nick} kupił \`${this.currField.name}\` za ${this.currField.cost}`,
        );
        await historyWriter.commit({
            'gameModel/auction': null,
            'gameModel/waitingToBuy': false,
            [`gameModel/fields/${this.currPlayer.position}`]: `${this.nick}|0`,
            [`playersModel/players/${this.nick}/money`]: this.myPlayer.money - this.currField.cost,
        });
    }

    public pass = async () => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        let update: { [key: string]: any } = {};

        this.auction!.players[this.auction!.round].isPlaying = false;
        const playing = this.auction!.players.filter((p) => p.isPlaying);

        historyWriter.add(`${this.nick} spasował`);
        if (playing.length == 0) {
            update = {
                'gameModel/auction': null,
                'gameModel/waitingToBuy': false,
            };
            historyWriter.add('Licytacja zakończona bez zwycięscy');
        } else if (playing.length == 1) {
            update = {
                'gameModel/auction': null,
                'gameModel/waitingToBuy': false,
                [`gameModel/fields/${this.currPlayer.position}`]: `${playing[0].name}|0`,
                [`playersModel/players/${playing[0].name}/money`]: this.players[playing[0].name]!.money - this.auction!.value,
            };
            historyWriter.add(
                `${playing[0].name} wygrał licytację z ceną ${this.auction!.value}`,
                playing[0].name,
            );
        } else {

            let round = (this.auction!.round + 1) % this.auction!.players.length;
            while (!this.auction!.players[round].isPlaying) round = (round + 1) % this.auction!.players.length;


            update = {
                [`gameModel/auction/players/${this.auction!.round}`]: `${this.nick}|${this.auction!.players[this.auction!.round].value}|0`,
                'gameModel/auction/round': round,
            };
        }

        await historyWriter.commit(update);
    }

    public pay = async () => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        const update: { [key: string]: any } = {
            [`gameModel/haveToPay/${this.nick}`]: null,
            [`playersModel/players/${this.nick}/money`]: this.myPlayer.money - this.haveToPay[this.nick]!,
        };

        if (this.currField.type == 'card') {
            if (this.nick == this.round) {
                historyWriter.add(`${this.nick} zapłacił ${this.haveToPay[this.nick]!}`);
                const parking = this.fields.find(f => f.type == 'parking')!;
                update[`gameModel/fields/${this.fields.indexOf(parking)}`] = `|${parking.buildingCount + this.haveToPay[this.nick]!}`;
            } else {
                update[`playersModel/players/${this.round}/money`] = this.currPlayer.money + this.haveToPay[this.nick]!;
                historyWriter.add(`${this.nick} zapłacił ${this.haveToPay[this.nick]!} za urodziny ${this.round}`);
            }
        } else {
            if (this.myField.type == 'payment') {
                const parking = this.fields.find(f => f.type == 'parking')!;
                update[`gameModel/fields/${this.fields.indexOf(parking)}`] = `|${parking.buildingCount + this.haveToPay[this.nick]!}`;
            } else {
                update[`playersModel/players/${this.myField.player}/money`] = this.players[this.myField.player]!.money + this.haveToPay[this.nick]!;
            }

            historyWriter.add(`${this.nick} zapłacił ${this.haveToPay[this.nick]!} za \`${this.myField.name}\``);
        }
        await historyWriter.commit(update);
    }

    public demandPayment = async () => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        const payerField = this.fields[this.players[this.canPay!]!.position];
        let cost = payerField.cost;

        const streetName = this.fields.find((f) => f.players.includes(this.canPay!))?.name;

        if (payerField.type == 'street') {
            cost = payerField.buildingRent[payerField.buildingCount];
            if (payerField.isDoubleRent) cost *= 2;
            historyWriter.add(`${this.nick} upomina się od ${this.canPay} o opłatę ${cost} za \`${streetName}\``);
        } else if (payerField.type == 'trainStop') {
            cost = payerField.buildingRent[payerField.buildingCount - 1];
            historyWriter.add(`${this.nick} upomina się od ${this.canPay} o opłatę ${cost} za \`${streetName}\``);
        } else if (payerField.type == 'infrastructure') {
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            cost = payerField.buildingRent[payerField.buildingCount - 1] * (dice1 + dice2);

            historyWriter.add(`${this.nick} upomina się od ${this.canPay} o opłatę ${cost} za \`${streetName}\` - ${this.canPay} rzucił (${dice1},${dice2})`);
        }

        await historyWriter.commit({
            [`gameModel/haveToPay/${this.canPay}`]: cost,
            'gameModel/canPay': null,
        });
    }

    public takeStart = async () => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        historyWriter.add(`${this.nick} wziął ${this.fields[0].cost} za start`);
        await historyWriter.commit({
            [`playersModel/players/${this.nick}/money`]: this.myPlayer.money + this.fields[0].cost,
            'gameModel/canTakeStart': false,
        });
    }

    // ---- field info buttons ----

    public turnOfField = async (field: Field) => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        historyWriter.add(
            `${this.nick} ${field.isOff ? 'wykupił' : 'zastawił'} \`${field.name}\``,
        );
        await historyWriter.commit(field.isOff
            ? {
                [`playersModel/players/${this.nick}/money`]: this.myPlayer.money - field.cost / 2,
                [`gameModel/fields/${this.fields.indexOf(field)}`]: `${this.nick}|0`,
            }
            : {
                [`playersModel/players/${this.nick}/money`]: this.myPlayer.money + field.cost / 2,
                [`gameModel/fields/${this.fields.indexOf(field)}`]: `${this.nick}|0|1`,
            });
    }

    public sellField = async (field: Field) => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);
        historyWriter.add(`${this.nick} sprzedał \`${field.name}\``);
        await historyWriter.commit({
            [`playersModel/players/${this.nick}/money`]: this.myPlayer.money + (field.isOff ? field.cost / 2 : field.cost),
            [`gameModel/fields/${this.fields.indexOf(field)}`]: '|0',
        });
    }

    public sellHouse = async (field: Field) => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);

        const other = this.fields
            .filter((f) => f.street == field.street && f.name != field.name)
            .sort((a, b) => b.buildingCount - a.buildingCount);

        if (other[0].buildingCount > field.buildingCount) {
            field = other[0];
        }

        historyWriter.add(
            field.buildingCount == 5
                ? `${this.nick} sprzedał hotel na \`${field.name}\``
                : `${this.nick} sprzedał ${field.buildingCount} dom na \`${field.name}\``,
        );

        await historyWriter.commit({
            [`playersModel/players/${this.nick}/money`]: this.myPlayer.money + field.buildingCost,
            [`gameModel/fields/${this.fields.indexOf(field)}`]: `${this.nick}|${field.buildingCount - 1}`,
        });
    }

    public buyHouse = async (field: Field) => {
        const historyWriter = new HistoryWriter(this.nick, this.gameRoom);

        const other = this.fields
            .filter((f) => f.street == field.street && f.name != field.name)
            .sort((a, b) => a.buildingCount - b.buildingCount);

        if (other[0].buildingCount < field.buildingCount) {
            field = other[0];
        }

        if (field.buildingCount == 4) {
            historyWriter.add(`${this.nick} postawił hotel na \`${field.name}\``);
        } else {
            historyWriter.add(
                `${this.nick} postawił ${field.buildingCount + 1} dom na \`${field.name}\``,
            );
        }
        await historyWriter.commit({
            [`playersModel/players/${this.nick}/money`]: this.myPlayer.money - field.buildingCost,
            [`gameModel/fields/${this.fields.indexOf(field)}`]: `${this.nick}|${field.buildingCount + 1}`,
        });
    }

}