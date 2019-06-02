import { ILapLog, IRaceRanking, IRaceOptions, IPilot } from '../model';
import { IMap, regexAll, average, elapsedDuration } from '../util';
import { Service, Inject } from 'typedi';
import { LogParserService, serializeNumber, serializeDuration, serializeTime, serializeLapLog, serializeRanking } from './log-parser.service';
import moment = require('moment');

export class Race {
    
    isFinished = false;

    logs: ILapLog[] = [];

    ranking: IRaceRanking[] = [];
    raceOptions: IRaceOptions = {laps: 4};
    
    pilotsMap: IMap<IPilot> = {};
    pilotsArr: IPilot[] = [];
    pilotsLogs: IMap<ILapLog[]> = {};
    pilotsProofTime: IMap<moment.Duration> = {};


    /* 
     * Descobrir a melhor volta de cada piloto
     */
    pilotBestLap: IMap<ILapLog> = {};

    /* 
     * Calcular a velocidade média de cada piloto durante toda corrida
     */
    averageSpeed: IMap<number> = {};

    bestLap: ILapLog | null = null;

    /**
     * Descobrir quanto tempo cada piloto chegou após o vencedor
     */
    latecomersTime: IMap<moment.Duration> = {}
    
    constructor(
        @Inject(type => LogParserService) private logParserService: LogParserService
    ){ 

    }
    
    startRace(raceOptions: IRaceOptions){
        this.isFinished = false;
        this.ranking = [];
        this.logs = [];
        this.raceOptions = {laps: 4, ...raceOptions};
        
        this.pilotsMap = {};
        this.pilotsLogs = {};
        this.pilotBestLap = {};
        this.averageSpeed = {};    
        this.bestLap =  null;
        this.latecomersTime = {};

    }

    appendLog(logString: string) {
        
        let lapLogs = this.logParserService.parseLog(logString);
        lapLogs = lapLogs
        .sort((a: ILapLog, b: ILapLog) => {
            if(a.time.isBefore(b.time)) return -1;
            if(a.time.isAfter(b.time)) return 1;
            return 0;
        });

        for (let l = 0; l < lapLogs.length; l++) {
            const lapLog = lapLogs[l];
            
            this.appendPilot(lapLog);
           
            this.measureRanking(lapLog);
            this.measureBestLap(lapLog);
            this.measurePilotBestLap(lapLog);
            
        };

        this.pilotsArr.map(p => this.measureAverageSpeed(p));

    }

   measureAverageSpeed(p: IPilot) {
        
        const speeds = this.pilotsLogs[p.id].map(l => l.avgSpeed);
        
        this.averageSpeed[p.id] = average(speeds);
        
    }

    appendPilot(l: ILapLog) {
        
        if(this.pilotsMap[l.pilot.id]){
            
            const timeAmount = this.pilotsProofTime[l.pilot.id];
            this.pilotsProofTime[l.pilot.id] = timeAmount.add(l.lapTime);
            
            this.pilotsLogs[l.pilot.id].push(l);

            return ;
        } 

        const pilot = {...l.pilot};

        this.pilotsMap[l.pilot.id] = pilot;
        this.pilotsArr.push(pilot);
        this.pilotsLogs[l.pilot.id] = [];
        this.pilotsProofTime[l.pilot.id] = l.lapTime;
    }

    measurePilotBestLap(l: ILapLog) {
        const latestBest = this.pilotBestLap[l.pilot.id];
        const hasBestLap = !!latestBest;

        if(!hasBestLap){
            this.pilotBestLap[l.pilot.id] = l;
            return;
        }

        if(l.lapTime.asMilliseconds() < latestBest.lapTime.asMilliseconds() ){
            this.pilotBestLap[l.pilot.id] = l;
            return;
        }
    }

    /* 
     * Descobrir a melhor volta da corrida
     */
    measureBestLap(l: ILapLog){
        
        if(this.bestLap && l.lapTime.asMilliseconds() > this.bestLap.lapTime.asMilliseconds() ) return;

        this.bestLap = {...l};
    }
    measureRanking(l: ILapLog) {
        
        if(this.isFinished){
            
            const firstRankTime = this.ranking[0].time;
            this.latecomersTime[l.pilot.id] = elapsedDuration(firstRankTime, l.time);
            
            console.debug(`## Latecomer ${l.pilot.name} at ${serializeTime(l.time)}:  ${serializeDuration(this.latecomersTime[l.pilot.id])}`);
        }
        
        if( l.lapNumber >= this.raceOptions.laps ) {
            
            this.isFinished = true;

            if(this.ranking.length==0) {
                console.debug(`## First place ${l.pilot.name} at ${serializeTime(l.time)}`);
            }
            this.ranking.push({
                position: this.ranking.length+1, 
                pilot: l.pilot,
                lastLap: l.lapNumber,
                time: l.time,
                proofTime: this.pilotsProofTime[l.pilot.id]
            });
        }
        

    }

    printSummary(): string[] {
        const summary: string[] = []
        
        summary.push(`Posição Chegada\tCódigo Piloto\tNome Piloto\tQtde Voltas Completadas\tTempo Total de Prova`);
        this.ranking.map(r => summary.push('\t' + serializeRanking(r)));

        
        if(this.bestLap) {
            summary.push(`Melhor volta da corrida`);
            summary.push('\t' + serializeLapLog(this.bestLap));
        }
        
        summary.push(`Melhor volta de cada piloto`);
        this.pilotsArr
        .sort((a: IPilot, b: IPilot) => {
            if(this.pilotBestLap[a.id] < this.pilotBestLap[b.id]) return -1;
            if(this.pilotBestLap[a.id] > this.pilotBestLap[b.id]) return 1;
            return 0
        })
        .map(p => { 
            summary.push('\t' + serializeLapLog(this.pilotBestLap[p.id])); 
        });

        summary.push(`Velocidade média de cada piloto durante toda corrida`);
        this.pilotsArr
        .sort((a: IPilot, b: IPilot) => {
            if(this.averageSpeed[a.id] < this.averageSpeed[b.id]) return 1;
            if(this.averageSpeed[a.id] > this.averageSpeed[b.id]) return -1;
            return 0
        })
        .map(p => { 
            summary.push(`\t${p.id} - ${p.name}: ` + serializeNumber(this.averageSpeed[p.id].toFixed(3))); 
        });
        
        summary.push(`Quanto tempo cada piloto chegou após o vencedor`);
        this.pilotsArr
        .filter((p: IPilot) => !!this.latecomersTime[p.id])
        .sort((a: IPilot, b: IPilot) => {
            if(this.latecomersTime[a.id] < this.latecomersTime[b.id]) return -1;
            if(this.latecomersTime[a.id] > this.latecomersTime[b.id]) return 1;
            return 0
        })
        .map(p => { 
            summary.push(`\t${p.id} - ${p.name}: ` + serializeDuration(this.latecomersTime[p.id])); 
        });
     
        return summary;
    }
    printLogs(): string[] {

        return this.logs.map(serializeLapLog);

    }

        

}