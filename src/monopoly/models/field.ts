import { PlayerModel, playersColors } from "./player"

type FieldType = 'start' | 'street' | 'card' | 'payment' | 'trainStop' | 'jail' | 'infrastructure' | 'parking' | 'goToJail'

export class Field {
    buildingCount: number = 0
    isOff: boolean = false
    player: string = ''
    players: string[] = []
    isComplit: boolean = false

    get streetColor() {
        const colors: Partial<Record<FieldType, number[]>> = {
            'street': playersColors[this.street],
            'infrastructure': [255, 255, 191, 0],
            'trainStop': [255, 102, 153, 204],
        };
        return colors[this.type] ?? [0, 0, 0, 0];
    };

    get isDoubleRent() { return this.isComplit && this.buildingCount == 0; }
    get canBeBought() { return !(this.player) && (this.type in ['street', 'infrastructure', 'trainStop']); }

    // const buildings = (color: number[]) => this.type == 'street'
    //   ? this.buildingCount > 4
    //     ? [Icon(Icons.home_work, color: color)]
    //     : List.generate(
    //       buildingCount,
    //       (_) => Icon(Icons.home_rounded, color: color),
    //     )
    //   : [];

    constructor(
        public type: FieldType,
        public name: string,
        public cost: number,
        public street = -1,
        public buildingRent: number[] = [],
        public buildingCost = 0,
    ) { }
}

const streetColors = [
    [255, 155, 55, 0],
    [255, 105, 205, 255],
    [255, 208, 85, 233],
    [255, 231, 143, 27],
    [255, 231, 27, 27],
    [255, 238, 255, 86],
    [255, 9, 139, 31],
    [255, 27, 69, 255],
];

export const fieldsTemplate: Field[] = [
    new Field('start', 'Start', 200),
    new Field('street', 'Ulica Konopnicka', 60, 0, [2, 10, 30, 90, 160, 250], 50),
    new Field('card', 'Kasa społeczna', 0),
    new Field('street', 'Ulica Stalowa', 60, 0, [4, 20, 60, 180, 320, 450], 50),
    new Field('payment', 'Podatek dochodowy', 200),
    new Field('trainStop', 'Dworzec zachodni', 200, -1, [25, 50, 100, 200], 100),
    new Field('street', 'Ulica Radzymińska', 100, 1, [6, 30, 90, 270, 400, 550], 50),
    new Field('card', 'Szansa', 0),
    new Field('street', 'Ulica Jagielońska', 100, 1, [6, 30, 90, 270, 400, 550], 50),
    new Field('street', 'Ulica Targowa', 120, 1, [8, 40, 100, 300, 450, 600], 50),
    new Field('jail', 'Więzienie', 50),
    new Field('street', 'Ulica Płowiecka', 140, 2, [10, 50, 150, 450, 625, 750], 100),
    new Field('infrastructure', 'Elektrowania', 150, -1, [4, 10]),
    new Field('street', 'Ulica Marsa', 140, 2, [10, 50, 150, 450, 625, 750], 100),
    new Field('street', 'Ulica Grochowska', 160, 2, [12, 60, 180, 500, 700, 900], 100),
    new Field('trainStop', 'Dworzec Gdański', 200, -1, [25, 50, 100, 200], 100),
    new Field('street', 'Ulica Obozowa', 180, 3, [14, 70, 200, 550, 750, 950], 100),
    new Field('card', 'Kasa społeczna', 0),
    new Field('street', 'Ulica Górczewska', 180, 3, [14, 70, 200, 550, 750, 950], 100),
    new Field('street', 'Ulica Wołska', 200, 3, [16, 80, 220, 600, 800, 1000], 100),
    new Field('parking', 'Parking', 0),
    new Field('street', 'Ulica Mickiewicza', 220, 4, [18, 90, 250, 700, 875, 1050], 150),
    new Field('card', 'Szansa', 0),
    new Field('street', 'Ulica Słowackiego', 220, 4, [18, 90, 250, 700, 875, 1050], 150),
    new Field('street', 'Plac Wilsona', 240, 4, [20, 100, 300, 750, 925, 1100], 150),
    new Field('trainStop', 'Dworzec Wschodni', 200, -1, [25, 50, 100, 200], 100),
    new Field('street', 'Ulica Świętokrzystka', 260, 5, [22, 110, 330, 800, 975, 1150], 150),
    new Field('street', 'Krakowskie Przedmieście', 260, 5, [22, 110, 330, 800, 975, 1150], 150),
    new Field('infrastructure', 'Wodociągi', 150, -1, [4, 10]),
    new Field('street', 'Nowy Świat', 280, 5, [22, 120, 360, 850, 1025, 1200], 150),
    new Field('goToJail', 'Idź do więzienia', 0),
    new Field('street', 'Plac Trzech Krzyży ', 300, 6, [26, 130, 390, 900, 1100, 1275], 200),
    new Field('street', 'Ulica Marszałkowska', 300, 6, [26, 130, 390, 900, 1100, 1275], 200),
    new Field('card', 'Kasa społeczna', 0),
    new Field('street', 'Aleje Jerozolimskie', 320, 6, [28, 150, 450, 1000, 1200, 1400], 200),
    new Field('trainStop', 'Dworzec Centralny', 200, -1, [25, 50, 100, 200], 100),
    new Field('card', 'Szansa', 0),
    new Field('street', 'Ulica Belwederska', 350, 7, [35, 175, 500, 1100, 1300, 1500], 200),
    new Field('payment', 'Domiar podatkowy', 100),
    new Field('street', 'Aleje Ujazdowskie', 400, 7, [50, 200, 600, 1400, 1700, 2000], 200),
]

export function parseFieldsFromJson(data: any, playerData: { [name: string]: PlayerModel }): Field[] {
    const fields: Field[] = fieldsTemplate;

    if (!Array.isArray(data) || data.length !== fields.length) {
        return fields;
    }

    for (let i = 0; i < fields.length; i++) {
        let f = data[i].split('|');
        fields[i].player = playerData.hasOwnProperty(f[0]) ? f[0] : '';
        fields[i].buildingCount = parseInt(f[1], 10);
        if (f.length > 2) {
            fields[i].isOff = f[2] === '1';
        }
    }

    Object.entries(playerData).forEach(([name, p]) => {
        fields[p.position].players.push(name);
    });

    for (let i = 0; i < streetColors.length; i++) {
        let street = fields.filter(
            (f) => f.type === 'street' && f.street === i
        );
        if (
            street.length > 0 &&
            street[0].player !== '' &&
            street.every((f) => f.player === street[0].player && !f.isOff)
        ) {
            street.forEach((f) => {
                f.isComplit = true;
            });
        }
    }

    let infrastructures = fields.filter(
        (f) =>
            f.type === 'infrastructure' && f.player !== '' && !f.isOff
    );

    infrastructures.forEach((structure) => {
        structure.buildingCount = infrastructures.filter(
            (f) => f.player === structure.player
        ).length;
    });

    let trainStops = fields.filter(
        (f) => f.type === 'trainStop' && f.player !== '' && !f.isOff
    );

    trainStops.forEach((train) => {
        train.buildingCount = trainStops.filter(
            (f) => f.player === train.player
        ).length;
    });

    return fields;
}

export function parseFieldsToJson(fields: Field[]): any {
    return fields.map(f => `${f.player}|${f.buildingCount}`);
}