import moment = require("moment");

export interface IMap<T> {
    [index: string]: T;
    [index: number]: T;
}

export function regexAll(inputContent: string, regex: RegExp): RegExpMatchArray[]{
    const result: RegExpMatchArray[] = [];
    let m;
    regex.lastIndex = -1;

    while ((m = regex.exec(inputContent)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        result.push(m);
    }
    return result;
}

export function average(arr: number[]): number {
    return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length
}

export function elapsedDuration(startTime: moment.Moment, endTime: moment.Moment): moment.Duration {
    return moment.duration(endTime.diff(startTime));
}