/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import CheckCreate from '../checkCreate';

import txTemplates from './templates/CheckCreateTx.json';

describe('CheckCreate tx', () => {
    it('Should set tx type if not set', () => {
        const checkCreate = new CheckCreate();
        expect(checkCreate.Type).toBe('CheckCreate');
    });

    it('Should return right parsed values', () => {
        const instance = new CheckCreate(txTemplates);

        expect(instance.SendMax).toStrictEqual({
            currency: 'XRP',
            value: '100',
        });

        expect(instance.Expiration).toBe('2018-01-24T12:52:01.000Z');

        expect(instance.Destination).toStrictEqual({
            tag: 1,
            address: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
            name: undefined,
        });

        expect(instance.InvoiceID).toBe('6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B');
    });

    it('Should set/get fields', () => {
        const instance = new CheckCreate();

        // @ts-ignore
        instance.SendMax = '100';
        expect(instance.SendMax).toStrictEqual({
            currency: 'XRP',
            value: '100',
        });

        // @ts-ignore
        instance.SendMax = {
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        };
        expect(instance.SendMax).toStrictEqual({
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        });
    });
});
