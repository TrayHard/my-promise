const STATES = {
    PENDING: "PENDING",
    REJECTED: "REJECTED",
    FULFILLED: "FULFILLED",
};

const STEP_TYPES = {
    then: "then",
    catch: "catch",
    finally: "finally",
}

class MyPromise {
    #state = STATES.PENDING;
    #queueThen = [];
    #queueCatch = [];
    #value;

    constructor(callback) {
        try {
            callback(this.#resolve.bind(this), this.#reject.bind(this))
        } catch (e) {
            this.#reject.call(this, e)
        }
    }

    get #isPending() {
        return this.#state === STATES.PENDING;
    }

    get #isFulfilled() {
        return this.#state === STATES.FULFILLED;
    }

    get #isRejected() {
        return this.#state === STATES.REJECTED;
    }

    #update(value, state) {
        queueMicrotask(() => {
            if (!this.#isPending) return;
            if (MyPromise.isPromise(value)) {
                value.then(this.#resolve.bind(this), this.#reject.bind(this))
                return;
            }
            this.#value = value;
            this.#state = state;
            this.#exec();
        })
    }

    static isPromise(x) {
        return x && (typeof x.then === 'function');
    }

    #resolve(val) {
        this.#update(val, STATES.FULFILLED)
    }

    #reject(err) {
        this.#update(err, STATES.REJECTED)
    }

    #exec() {
        if (this.#isPending) return;
        if (this.#isFulfilled) {
            this.#queueThen.forEach((func) => func(this.#value))
        }
        if (this.#isRejected) {
            if (!this.#queueCatch.length) throw new UncaughtPromiseError(this.#value);
            this.#queueCatch.forEach((func) => func(this.#value))
        }
    }

    then(callbackSuccess, callbackError) {
        return new MyPromise((resolve, reject) => {
            this.#queueThen.push((value) => {
                try {
                    if (callbackSuccess) {
                        resolve(callbackSuccess(value));
                    } else {
                        resolve(value);
                    }
                } catch (e) {
                    reject(e);
                }
            })
            this.#queueCatch.push((value) => {
                try {
                    if (callbackError) {
                        resolve(callbackError(value));
                    } else {
                        reject(value);
                    }
                } catch (e) {
                    reject(e);
                }
            })
            this.#exec();
        })
    }

    catch(callbackError) {
        return this.then(undefined, callbackError)
    }

    finally(callback) {
        return this.then(() => {
            callback();
            return this.#value;
        }, () => {
            callback();
            throw this.#value;
        })
    }

    static resolve(value) {
        return new MyPromise((res) => res(value));
    }

    static reject(value) {
        return new MyPromise((_, rej) => rej(value));
    }
}

class UncaughtPromiseError extends Error {
    constructor(error) {
        super(error);
        this.stack = '(in promise)' + error.stack;
    }
}

module.exports = MyPromise
