import { AuctionModel } from "./auction";
import { Field } from "./field";
import { PlayerModel } from "./player"

export class MonopolyModel {
    constructor(
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
        public canPay?: string,
        public auction?: AuctionModel,
    ) { }
}