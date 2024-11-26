export class Trade {
    constructor(
        public key: string,
        public oponent: string,
        public myFields: number[],
        public oponentFields: number[],
        public money: number,
        public accepted: boolean,
        public oponentAccepted: boolean,
    ) { };

    static fromJson(key: string, data: { [key: string]: any }, nick: string): Trade | null {
        const players = (data['players']).split('|');
        const fields = (data['fields'] as string).split('|').map(f => {
            if (f == '') return [];
            return f.split(';').map(f => parseInt(f));
        });
        const accepted = (data['accepted'] as string).split('|');
        const myIndex = players.indexOf(nick);
        const oponentIndex = 1 - myIndex;

        if (myIndex < 0) return null;

        return new Trade(
            key,
            players[oponentIndex] ?? '',
            fields[myIndex],
            fields[oponentIndex],
            data['money'] * (myIndex == 1 ? -1 : 1),
            accepted[myIndex] == '1',
            accepted[oponentIndex] == '1',
        );
    }

    public toJson = (nick: string) => {
        return {
            money: this.money,
            players: `${nick}|${this.oponent}`,
            accepted: `${this.accepted ? 1 : 0}|${this.oponentAccepted ? 1 : 0}`,
            fields: `${this.myFields.join(';')}|${this.oponentFields.join(';')}`
        };
    };

    static basic() {
        return new Trade('', '', [], [], 0, false, false)
    }
}