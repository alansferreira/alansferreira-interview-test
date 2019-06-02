import { expect } from 'chai';
import { describe } from 'mocha';
import { elapsedDuration } from './util';
import { parseTime } from './services/log-parser.service';
import moment = require("moment");


describe('Test #utils', () => {

    it('should test $elapsedDuration', async () => {
        const startTime = parseTime('23:49:08.277');
        const endTime = parseTime('23:50:08.277');

        const elapsedTime = elapsedDuration(startTime, endTime);
        
        expect(elapsedTime.minutes()).to.equal(1);
        expect(elapsedTime.seconds()).to.equal(0);
        expect(elapsedTime.milliseconds()).to.equal(0);
        
    });


});