import * as moment from 'moment';


export interface IPilot {
    id: number;
    name: string;
}

export interface ILapLog {
    time: moment.Moment;
    pilot: IPilot;
    lapNumber: number;
    lapTime: moment.Duration;
    avgSpeed: number;
}

export interface IRaceRanking {
    position: number;
    pilot: IPilot;
    lastLap: number;
    proofTime?: moment.Duration;
}

export interface IRaceOptions {
    laps: number
}