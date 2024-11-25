export class AuctionModel {
  private constructor(
    public value: number,
    public round: number,
    public players: AuctionPlayer[],
  ) { };

  public static fromJson = (data: { [key: string]: any } | null) => data == null ? null : new AuctionModel(
    (data['players'] ?? []).reduce((p: number, v: string) => Math.max(parseInt(v.split('|')[1]), p), 0),
    data['round'] ?? 0,
    (data['players'] ?? []).map((p: string) => new AuctionPlayer(
      p.split('|')[0],
      parseInt(p.split('|')[1]),
      p.split('|')[2] == '1',
    ))
  )
}

export class AuctionPlayer {
  constructor(
    public name: string,
    public value: number,
    public isPlaying: boolean,
  ) { };
}
