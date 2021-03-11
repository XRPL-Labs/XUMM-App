import Realm, { Results, ObjectSchema } from 'realm';
import { forEach, isObject, isString, assign } from 'lodash';
import EventEmitter from 'events';

export default class BaseRepository extends EventEmitter {
    realm: Realm;
    schema: ObjectSchema;

    normalizeQuery = (query: string | Object): string => {
        if (isString(query)) return query;

        if (isObject(query)) {
            const props = this.schema.properties;
            const queries = [] as string[];
            let queryString = '';

            forEach(query, (value, key) => {
                if (Object.prototype.hasOwnProperty.call(props, key)) {
                    const properties = props[key];
                    let type = '';
                    let filter = '';

                    if (isObject(properties)) {
                        // FIXME
                        // @ts-ignore
                        type = properties.type;
                    } else {
                        type = properties;
                    }

                    if (type === 'bool') {
                        filter = value;
                    } else {
                        filter = ` "${value}"`;
                    }

                    queries.push(`${key} == ${filter}`);
                }
            });
            forEach(queries, (value, index) => {
                if (index < queries.length - 1) {
                    queryString += ` ${value} AND `;
                } else {
                    queryString += ` ${value} `;
                }
            });

            return queryString;
        }

        return '';
    };

    safeWrite = (f: any) => {
        if (this.realm.isInTransaction) {
            setTimeout(() => {
                this.safeWrite(f);
            }, 50);
        } else {
            this.realm.write(() => {
                f();
            });
        }
    };

    count = (): number => {
        const result = this.findAll();
        return result.length;
    };

    findAll = (): Results<any> => {
        return this.realm.objects(this.schema.name);
    };

    findBy = (key: string, val: string): Results<any> => {
        return this.realm.objects(this.schema.name).filtered(`${key} == "${val}"`);
    };

    findOne = (query: string | object): any => {
        const result = this.realm.objects(this.schema.name).filtered(this.normalizeQuery(query));

        if (result.length === 0) {
            return undefined;
        }

        if (result.length === 1) {
            return result[0];
        }

        throw new Error('Got more than one result');
    };

    query = (query: string | object): Results<any> => {
        return this.realm.objects(this.schema.name).filtered(this.normalizeQuery(query));
    };

    upsert = (data: any, query: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            const result = this.realm.objects(this.schema.name).filtered(this.normalizeQuery(query)) as any;

            if (result.length === 0) {
                try {
                    this.safeWrite(() => {
                        resolve(this.realm.create(this.schema.name, data));
                    });
                } catch (error) {
                    reject(error);
                }
            }

            if (result.length === 1) {
                const object = result[0];

                try {
                    this.safeWrite(() => {
                        resolve(
                            this.realm.create(this.schema.name, assign(data, { id: object.id }), Realm.UpdateMode.All),
                        );
                    });
                } catch (error) {
                    reject(error);
                }
            }

            reject(new Error('Got more than one result'));
        });
    };

    create = (data: any, update = false): Promise<any> => {
        return new Promise((resolve, reject) => {
            try {
                this.safeWrite(() => {
                    resolve(this.realm.create(this.schema.name, data, update && Realm.UpdateMode.All));
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    createList = (dataList: any[], update = false) => {
        try {
            this.safeWrite(() => {
                for (let i = 0; i < dataList.length; i++) {
                    const data = dataList[i];

                    this.realm.create(this.schema.name, data, update && Realm.UpdateMode.All);
                }
            });

            return dataList;
        } catch (error) {
            return error;
        }
    };

    deleteBy = (key: string, val: string): Promise<any> => {
        return new Promise<void>((resolve, reject) => {
            try {
                const items = this.realm.objects(this.schema.name).filtered(`${key} == "${val}"`);
                const item = items[0];

                if (item) {
                    this.safeWrite(() => {
                        resolve(this.realm.delete(item));
                    });
                } else {
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    deleteAll = () => {
        try {
            const items = this.realm.objects(this.schema.name);

            if (items.length > 0) {
                this.safeWrite(() => {
                    this.realm.delete(items);
                });
            }

            return true;
        } catch (error) {
            return error;
        }
    };
}
