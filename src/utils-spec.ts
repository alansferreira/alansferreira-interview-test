import { expect } from 'chai';
import { describe } from 'mocha';
import { elapsedDuration } from './util';
import { parseTime, serializeDuration } from './services/log-parser.service';
import moment = require("moment");


describe('Test #utils', () => {

    it('should test $elapsedDuration', async () => {
        const startTime = parseTime('23:52:17.003');
        const endTime = parseTime('23:52:22.120');

        const elapsedTime = elapsedDuration(startTime, endTime);
        
        expect(elapsedTime.minutes()).to.equal(0);
        expect(elapsedTime.seconds()).to.equal(5);
        expect(elapsedTime.milliseconds()).to.equal(117);
    });


});