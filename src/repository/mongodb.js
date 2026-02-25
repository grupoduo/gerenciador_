import { MongoClient, ObjectId } from "mongodb";

function pegaServico(mongo) {
    let i = mongo.search(/\?/);
    if (i > -1)
        return mongo.split("/")[mongo.split("/").length - 1].split("?")[0];
    else return mongo.split("/")[mongo.split("/").length - 1];
}

export class Mongodb {
    /**
     * @typedef { import("mongodb").MongoClient } MongoClient
     * @type {MongoClient}
     */
    mongoclient;
    /**
     * @typedef { import("mongodb").Db } Db
     * @type {Db}
     */
    db;
    /**
     *
     * @param {String} url
     */
    constructor(url) {
        this.mongoclient = new MongoClient(url, {
            maxConnecting: 20,
            maxPoolSize: 20,
        });
        this.db = this.mongoclient.db("gerenciador");
    }
}

/**
 * @typedef { import("..") } Repository
 * @implements {Repository}
 */
export default class RepositoryMongoDB {
    /**
     * @type {Mongodb}
     */
    mongo;
    /**
     *
     * @param {Mongodb} mongo
     */
    constructor(mongo) {
        this.mongo = mongo;
    }

    /**
     *
     * @param {String} value
     * @returns {[any, boolean]}
     */
    convertMainKey(value) {
        if (value === "") return ["", false];
        try {
            return [new ObjectId(value), false];
        } catch (error) {
            return [error, true];
        }
    }

    /**
     *
     * @param {String} collection
     * @param {any} value
     * @returns {Promise<[any, boolean]>}
     */
    async create(collection, value) {
        value._id = new ObjectId();
        return new Promise((res) => {
            this.mongo.db
                .collection(collection)
                .insertOne(value)
                .then((result) => {
                    res([value, false]);
                })
                .catch((err) => {
                    if (err) res([err, true]);
                });
        });
    }

    /**
     *
     * @param {String} collection
     * @param {String} id
     * @param {any} value
     * @returns {Promise<[any, boolean]>}
     */
    async update(collection, id, value) {
        return new Promise((res) => {
            this.mongo.db
                .collection(collection)
                .updateOne({ _id: new ObjectId(id) }, { $set: value })
                .then((result) => res([result, false]))
                .catch((err) => res([err, true]));
        });
    }

    /**
     *
     * @param {String} collection
     * @param {any} query
     * @param {any} value
     * @returns {Promise<[any, boolean]>}
     */
    updateMany(collection, query, value) {
        return new Promise((res) => {
            this.mongo.db
                .collection(collection)
                .updateMany(query, { $set: value })
                .then((result) => res([result, false]))
                .catch((err) => res([err, true]));
        });
    }

    /**
     *
     * @param {String} collection
     * @param {any} query
     * @param {any} value
     * @returns {Promise<[any, boolean]>}
     */
    async updateQuery(collection, query, value) {
        return new Promise((res) => {
            this.mongo.db
                .collection(collection)
                .updateOne(query, { $set: value })
                .then((result) => res([result, false]))
                .catch((err) => res([err, true]));
        });
    }

    /**
     *
     * @param {String} collection
     * @param {String} id
     * @returns {Promise<[any, boolean]>}
     */
    async delete(collection, id) {
        return new Promise((res) => {
            this.mongo.db
                .collection(collection)
                .deleteOne({ _id: new ObjectId(id) })
                .then((result) => res([result, false]))
                .catch((err) => res([err, true]));
        });
    }

    /**
     *
     * @param {String} collection
     * @param {{[index: string]: any}} query
     * @returns {Promise<[any, boolean]>}
     */
    async deleteMany(collection, query) {
        return new Promise((res) => {
            this.mongo.db
                .collection(collection)
                .deleteMany(query)
                .then((result) => res([result, false]))
                .catch((err) => res([err, true]));
        });
    }

    /**
     *
     * @param {String} collection
     * @param {{[index: string]: any}} query
     * @returns {Promise<[any[], boolean]>}
     */
    async findMany(collection, query) {
        const result = await this.mongo.db
            .collection(collection)
            .find(query)
            .toArray();
        return [result ? result : [], false];
    }

    /**
     *
     * @param {String} collection
     * @param {{[index: string]: any}} query
     * @param {Number} limit
     * @param {1 | -1} sort
     * @returns {Promise<[any[], boolean]>}
     */
    async findManySortLimit(collection, query, limit, sort) {
        const result = await this.mongo.db
            .collection(collection)
            .find(query)
            .sort({ _id: sort })
            .limit(limit)
            .toArray();
        return [result ? result : [], false];
    }

	/**
     *
     * @param {String} collection
     * @param {{[index: string]: any}} query
     * @param {{[index: string]: any}} sortQuery
     * @returns {Promise<[any[], boolean]>}
     */
    async findManySort(collection, query, sortQuery) {
        const result = await this.mongo.db
            .collection(collection)
            .find(query)
            .sort(sortQuery)
            .toArray();
        return [result ? result : [], false];
    }

    /**
     *
     * @param {String} collection
     * @param {{[index: string]: any}} query
     * @returns {Promise<[any, boolean]>}
     */
    async findOne(collection, query) {
        const result = await this.mongo.db
            .collection(collection)
            .findOne(query);
        return [result, !result];
    }

    /**
     *
     * @returns {Promise<[any, boolean]>}
     */
    async teste() {
        return new Promise((res) => {
            this.mongo.mongoclient.connect().then((client) => {
                client.withSession(async (session) => {
                    session.removeAllListeners();
                    return session;
                });
            });
        });
    }
}