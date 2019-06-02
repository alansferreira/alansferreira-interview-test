import "reflect-metadata";
import { expect } from 'chai';
import { describe } from 'mocha';
import Container from "typedi";
import { RaceSummaryService } from './race-sumary.service';
import * as fs from 'fs';
import { ILapLog } from "../model";


describe('Test #race-sumary.service', () => {
    const raceSummaryService = Container.get(RaceSummaryService);
    const racelogs: string[] = fs.readFileSync('samples/racelogs.txt').toString().split('\n');


    it('should parse individual data types', async () => {
        raceSummaryService.startRace({laps: 4});

        raceSummaryService.appendLog(racelogs.join('\n'));
        
        raceSummaryService.logs.map((log: ILapLog) => console.log(log.time.format('HH:mm:ss.SSS')));

        console.log(raceSummaryService.logs);
    })


});