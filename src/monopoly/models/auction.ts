export class AuctionModel {
  constructor(
    public value: number,
    public round: number,
    public players: AuctionPlayer[],
  ) { };
}

export class AuctionPlayer {

  constructor(
    public name: string,
    public value: number,
    public isPlaying: boolean,
  ) { };
}
