
import { update } from '../../firebase.ts';

export class HistoryWriter {
    public key: string;
    private index: number = 0;
    private updates: { [key: string]: any } = {};


    constructor(private nick: string, private gameRoom: string) {
        this.key = `${Date.now()}-${nick}`;
    }

    public add = (message: string, nick = this.nick) =>
        this.updates[`history/${this.key}-${this.index++}`] = `${nick ?? this.nick}|${message}`;

    public commit = async (updates: { [key: string]: any }) => {
        const keys = Object.keys(updates);
        for (let i = 0; i < keys.length; i++) {
            this.updates[keys[i]] = updates[keys[i]];
        }

        await update(`games/rooms/${this.gameRoom}`, this.updates);
    }
}
