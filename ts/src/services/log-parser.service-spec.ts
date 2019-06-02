import { expect } from 'chai';
import * as fs from 'fs';
import { describe } from 'mocha';
import "reflect-metadata";
import Container from "typedi";
import { parseDuration, parseNumber, parseTime, LogParserService, serializeTime, serializeDuration, serializeNumber, serializeLapLog, serializeRanking } from './log-parser.service';
import moment = require('moment');
import { IRaceRanking } from '../model';


describe('Test #log-parser.service', () => {
    const logParserService = Container.get(LogParserService);
    const racelogs: string[] = fs.readFileSync('samples/racelogs.txt').toString().split('\n');


    it('should parse indivirual data types', async () => {        
        const parsedDate = parseTime('23:49:08.277');
        const parsedDuration = parseDuration('1:02.999');
        const parsedFloat = parseNumber('44,275');

        expect(parsedDate.hours()).to.equal(23);
        expect(parsedDate.minutes()).to.equal(49);
        expect(parsedDate.seconds()).to.equal(8);
        expect(parsedDate.milliseconds()).to.equal(277);

        expect(parsedDuration.minutes()).to.equal(1);
        expect(parsedDuration.seconds()).to.equal(2);
        expect(parsedDuration.milliseconds()).to.equal(999);

        expect(parsedFloat).to.equal(44.275);


        expect(serializeTime(parsedDate)).to.equal('23:49:08.277');
        expect(serializeDuration(parsedDuration)).to.equal('1:02.999');
        expect(serializeNumber(parsedFloat)).to.equal('44,275');
    })

    it('should discard header line', async () => {        
        try {
            const parsed = logParserService.parseLog(racelogs[0]);

            expect(parsed.length).to.equal(0);
            
        } catch (error) {
            throw new Error(error);
        }
    });
    
    it('should parse single log', async () => {        
        try {
            const lapLogs = logParserService.parseLog('23:49:08.277      038 – F.MASSA                           1		1:02.852                        44,275');
            
            expect(lapLogs.length).to.not.equal(0);
            

            const lapLog = lapLogs[0];

            expect(lapLog.time.hour()).to.equal(23);
            expect(lapLog.time.minute()).to.equal(49);
            expect(lapLog.time.second()).to.equal(8);
            expect(lapLog.time.millisecond()).to.equal(277);

            expect(lapLog.pilot.id).to.equal(38);
            expect(lapLog.pilot.name).to.equal('F.MASSA');
            
            expect(lapLog.lapNumber).to.equal(1);

            expect(lapLog.lapTime.minutes()).to.equal(1);
            expect(lapLog.lapTime.seconds()).to.equal(2);
            expect(lapLog.lapTime.milliseconds()).to.equal(852);

        } catch (error) {
            throw new Error(error);
        }
    });

    it('should parse all logs', async () => {        
        try {
            for (let l = 1; l < racelogs.length; l++) {

                if (racelogs[l] === '') continue;

                const parsed = logParserService.parseLog(racelogs[l]);

                expect(parsed.length).to.not.equal(0);

            }

        } catch (error) {
            throw new Error(error);
        }
    });


    it('should serialize single log', async () => {        
        try {
            const originalLog = '23:49:08.277\t038 – F.MASSA\t1\t1:02.852\t44,275';
            const lapLogs = logParserService.parseLog(originalLog);
            
            const lapLog = lapLogs[0];

            expect(serializeLapLog(lapLog)).to.equal(originalLog);


        } catch (error) {
            throw new Error(error);
        }
    });

    it('should serialize single ranking', async () => {        
        try {
            const r: IRaceRanking = {
                lastLap: 1,
                time: parseTime('23:49:12.667'),
                pilot: {
                    id: 22, 
                    name: 'pilot name'
                },
                position: 1,
                proofTime: parseDuration('1:50.55')
            }
            
            expect(serializeRanking(r)).to.equal('1	22 – pilot name	1	1:50.550');


        } catch (error) {
            throw new Error(error);
        }
    });

});