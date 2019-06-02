import { ILapLog, IRaceRanking } from '../model';
import { IMap, regexAll, leftPad } from '../util';
import moment = require('moment');
import { Service } from 'typedi';

export const ptBRLocale = moment.locale('pt-BR');

export const logRegex = /(\d+\:\d+\:\d+\.\d+)[ \t]+(\d+)[ \–\t]+([^ ]+)[ \t]+(\d+)[ \t]+((\d+\:)?\d+\:\d+\.\d+)[ \t]+([\d,]+)/g;
export const logTimeFormat = 'HH:mm:ss.SSS';

export function parseTime(value: string): moment.Moment { return moment(value, logTimeFormat); }
export function parseDuration(value: string): moment.Duration { return moment.duration('00:' + value); }
export function parseNumber(value: string): number { return Number.parseFloat(value.replace(',', '.')); }

export function serializeTime(value: moment.Moment): string { return value.format('HH:mm:ss.SSS'); }
export function serializeDuration(value: moment.Duration): string { return moment(value.asMilliseconds()).format('m:ss.SSS'); }
export function serializeNumber(value: number | string): string { return value.toString().replace('.', ','); }

export function serializeLapLog(l: ILapLog): string { 
    return `${serializeTime(l.time)}\t${l.pilot.id} – ${l.pilot.name}\t${l.lapNumber}\t${serializeDuration(l.lapTime)}\t${serializeNumber(l.avgSpeed)}`;
}

export function serializeRanking(r: IRaceRanking): string { 
    if(!r.proofTime){
        return `${r.position}\t${r.pilot.id} – ${r.pilot.name}\t${r.lastLap}\t...tempo não estimado`;
    } else {
        return `${r.position}\t${r.pilot.id} – ${r.pilot.name}\t${r.lastLap}\t${serializeDuration(r.proofTime)}`;
    }
}



@Service()
export class LogParserService {

    constructor(){ }

    parseLog(log: string): ILapLog[] {
        const lapLogs: ILapLog[] = [];

        const matchedLogs = regexAll(log, logRegex);
        let matchedLog;

        for (let i = 0; i < matchedLogs.length; i++) {
            
            matchedLog = matchedLogs[i];
            
            lapLogs.push({
                time: parseTime(matchedLog[1]),
                pilot: {
                    id: leftPad(Number.parseInt(matchedLog[2]).toFixed(0), 3), 
                    name: matchedLog[3]
                },
                lapNumber: Number.parseFloat(matchedLog[4]),
                lapTime: parseDuration(matchedLog[5]),
                avgSpeed: parseNumber(matchedLog[7]),
            });
        }

        return lapLogs;

    }
}