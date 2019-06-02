import { ILapLog, IRaceRanking, IRaceOptions, IPilot } from '../model';
import { IMap, regexAll, average } from '../util';
import { Service, Inject } from 'typedi';
import { LogParserService, serializeNumber, serializeDuration, serializeTime, serializeLapLog, serializeRanking } from './log-parser.service';
import moment = require('moment');

export class RaceSummaryService {
    
    isFinished = false;
    ranking: IRaceRanking[] = [];
    logs: ILapLog[] = [];
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
    latecomers: IMap<moment.Duration> = {}
    
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
        this.latecomers = {};

    }

    appendLog(logString: string) {
        
        const lapLogs = this.logParserService.parseLog(logString);
        lapLogs.map((p: ILapLog) => {
            this.appendPilot(p);

            this.pilotsLogs[p.pilot.id].push(p);
            
            this.measureBestLap(p);
            this.measureRanking(p);
            this.measurePilotBestLap(p);
            
        });

        this.pilotsArr.map(p => this.measureAverageSpeed(p));

    }
    measureAverageSpeed(p: IPilot) {
        
        const speeds = this.pilotsLogs[p.id].map(l => l.avgSpeed);
        
        this.averageSpeed[p.id] = average(speeds);
        
    }
    appendPilot(l: ILapLog) {
        
        const pilotId = l.pilot.id;
        if(this.pilotsMap[pilotId]){
            const timeAmount = this.pilotsProofTime[pilotId];
            this.pilotsProofTime[pilotId] = timeAmount.add(l.lapTime.asMilliseconds(), "milliseconds");
            return ;
        } 

        const pilot = {...l.pilot};

        this.pilotsMap[l.pilot.id] = pilot;
        this.pilotsArr.push(pilot);
        this.pilotsLogs[l.pilot.id] = [];
        this.pilotsProofTime[l.pilot.id] = moment.duration(l.time.milliseconds());
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
        if( l.lapNumber >= this.raceOptions.laps ) {
            this.ranking.push({
                position: this.ranking.length+1, 
                pilot: l.pilot,
                lastLap: l.lapNumber,
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
        this.pilotsArr.map(p => { 
            summary.push('\t' + serializeLapLog(this.pilotBestLap[p.id])); 
        });

        summary.push(`Velocidade média de cada piloto durante toda corrida`);
        this.pilotsArr.map(p => { 
            summary.push(`\t${p.id} - ${p.name}: ` + serializeNumber(this.averageSpeed[p.id].toFixed(3))); 
        });
        
        // summary.push(`Quanto tempo cada piloto chegou após o vencedor`);
        // this.pilotsArr.map(p => { 
        //     summary.push(`${p.id} - ${p.name}: ` + serializeDuration(this.latecomers[p.id])); 
        // });
     
        return summary;
    }
    printLogs(): string[] {

        return this.logs.map(serializeLapLog);

    }

        

}