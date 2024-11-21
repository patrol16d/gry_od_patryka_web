export const playersColors = [
    [255, 255, 255, 0],
    [255, 255, 0, 0],
    [255, 0, 102, 255],
    [255, 1, 168, 1],
    [255, 168, 1, 115],
    [255, 248, 113, 237],
];

export class PlayerModel {
    get color() { return playersColors[this.colorIndex] };

    constructor(
        public nick: string,
        public position: number,
        public colorIndex: number,
        public money: number,
        public inJailFor: number,
    ) { };
}