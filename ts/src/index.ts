import 'reflect-metadata';
import Container from 'typedi';
import * as fs from 'fs';
import * as path from 'path';
import { RaceSummaryService } from './services/race-sumary.service';
import * as program from 'commander';

program
    .version(require('../package.json').version)
    .option('-l, --logfile [value]', 'Set\'s the race log file')
    .option('-c, --laps [value]', 'Set\'s the race laps count')
    .parse(process.argv);


const _logfile = program.logfile;
const _laps = (program.laps || 4);

console.info(`Race log file: '${path.normalize(_logfile)}'`)

const raceSumary = Container.get(RaceSummaryService);
const racelogs: string[] = fs.readFileSync(_logfile).toString().split('\n');

raceSumary.startRace({laps: _laps});

raceSumary.appendLog(racelogs.join('\n'));

raceSumary.printLogs().map((s: string) => console.log(s));
raceSumary.printSummary().map((s: string) => console.log(s));

