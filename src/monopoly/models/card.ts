
type CardType = 'pay' | 'take' | 'move' | 'payForBuildings' | 'birthday'

class Card {
    constructor(
        public type: CardType,
        public cost: number = 0,
        public position: number = 0,
        public hotelCost: number = 0,
    ) { }
}

export const chanceCards = [
    new Card('pay', 100),
    new Card('pay', 150),
    new Card('pay', 200),
    new Card('take', 100),
    new Card('take', 100),
    new Card('take', 120),
    new Card('take', 120),
    new Card('take', 150),
    new Card('take', 150),
    new Card('move', 0, 3),
    new Card('move', 0, 15),
    new Card('move', 0, 21),
    new Card('move', 0, 30),
    new Card('move', 0, 31),
    new Card('birthday', 20),
    new Card('birthday', 50),
];
export const socialFundCards = [
    new Card('pay', 100),
    new Card('pay', 150),
    new Card('pay', 200),
    new Card('pay', 250),
    new Card('take', 100),
    new Card('take', 120),
    new Card('take', 150),
    new Card('move', 0, 0),
    new Card('move', 0, 8),
    new Card('move', 0, 28),
    new Card('move', 0, 30),
    new Card('move', 0, 39),
    new Card('payForBuildings', 20, 0, 50),
    new Card('payForBuildings', 20, 0, 50),
    new Card('payForBuildings', 50, 0, 100),
    new Card('payForBuildings', 50, 0, 100),
];

export function shuffleWithSeed<T>(seed: number, array: T[]): T[] {
    // Generator liczb pseudolosowych z ziarna (PRNG)
    function mulberry32(a: number) {
        return function () {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }

    const random = mulberry32(seed);

    // Kopiujemy oryginalną tablicę, aby jej nie modyfikować
    const shuffledArray = array.slice();

    // Algorytm Fisher-Yates do tasowania tablicy
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }

    return shuffledArray;
}
