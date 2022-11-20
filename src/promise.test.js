const MyPromise = require('./promise')

const resolvedValue = 5;
const timeoutForFulfilled = 1000;
const errMessage = 'My error';
const timeoutForRejected = 1000;

function raceTest(promise, time, errMessage) {
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(errMessage), time);
        })
    ])
}

describe('Promise', function () {
    describe('.then()', function () {
        it('works on fulfilled', function (done) {
            promise().then((arg) => done())
        })
        it('gets argument on fulfilled', function (done) {
            promise()
                .then((arg) => {
                    expect(arg).toBe(resolvedValue);
                    done();
                })
        })
        it('should not been called on rejected', function (done) {
            promise({ success: false })
                .then(() => {
                    done('should not been called')
                })
                .catch((err) => {
                    expect(err).toBe(errMessage);
                    done();
                })
        })
        it("with multiple thens for same promise", () => {
            const callback = v => expect(v).toEqual(resolvedValue)
            const mainPromise = promise()
            const promise1 = mainPromise.then(callback)
            const promise2 = mainPromise.then(callback)
            return Promise.allSettled([promise1, promise2])
        })
        it("with then and catch been ran in parallel for the same promise", () => {
            const successFunc = v => expect(v).toEqual(resolvedValue)
            const failFunc = v => expect(1).toEqual(2)
            const resolvePromise = promise().then(successFunc, failFunc)
            const rejectPromise = promise().catch(failFunc)
            return Promise.allSettled([resolvePromise, rejectPromise])
        })
    })

    describe('.catch()', function () {
        it('works on rejected', function (done) {
            promise({ success: false })
                .catch((err) => {
                    expect(err).toBe(errMessage);
                    done();
                })
        })
        it('doesnt work on fulfilled', async function () {
            expect.assertions(1);
            await expect(
                raceTest(
                    new Promise((resolve, reject) => {
                        promise().catch(() => resolve(resolvedValue))
                    }),
                    timeoutForRejected + 1000,
                    errMessage
                )
            ).rejects.toEqual(errMessage);
        })
    })

    describe('.catch().then()', function (done) {
        it('catch block should not break promise() chain', function (done) {
            promise()
                .catch((err) => {
                    return err + 1;
                })
                .then((arg) => {
                    expect(arg).toBe(resolvedValue);
                    done();
                })
        })
        it('catch should pass argument to next then', function (done) {
            promise({ success: false })
                .catch((err) => err + " been catched")
                .then((arg) => {
                    expect(arg).toBe(errMessage + " been catched");
                    done();
                })
        })
    })

    describe('.then().then()', function () {
        it('passes argument', function (done) {
            promise()
                .then((arg) => {
                    expect(arg).toBe(resolvedValue);
                    return arg + 1;
                })
                .then((arg) => {
                    expect(arg).toBe(resolvedValue + 1);
                    done();
                })
        })
    })

    describe('.then().catch()', function () {
        it('throws error, catch should work', function () {
            promise()
                .then((arg) => {
                    throw 'Error';
                })
                .catch((arg) => {
                    expect(arg).toBe('Error');
                })
        })
        it('no error, catch shouldn\'t work', function () {
            promise()
                .then((arg) => {
                    return arg + 1;
                })
                .catch((arg) => {
                    console.error('should not be called')
                    expect(arg).toBe('If it fails, then catch caught something it should not');
                })
        })
    })

    describe('.catch().catch()', function () {
        it('should not launch second catch', function () {
            expect(promise({ success: false })
                .catch((err) => {
                    expect(err).toBe(errMessage);
                    return err;
                })
                .catch((err) => {
                    expect(err).not.toBe(errMessage);
                })).resolve;
        })
    })

    describe('.then().then().catch()', function () {
        it('first then throws error, catch should work, then - should not', function (done) {
            promise()
                .then(() => {
                    throw 'Error';
                })
                .then((arg) => {
                    done(new Error('Second then should not be called'))
                })
                .catch((err) => {
                    expect(err).toBe('Error');
                    done();
                })
        })
    })

    describe('.then().catch().then()', function () {
        it('value should be passed to second then', function (done) {
            promise()
                .then((arg) => arg)
                .catch(() => {
                    done('Should not be called');
                })
                .then((arg) => {
                    expect(arg).toBe(resolvedValue);
                    done();
                })
        })
    })
});

function promise ({ success = true } = { success: true }) {
    return new MyPromise((resolve, reject) => {
        setTimeout(() => {
            if (success) resolve(resolvedValue)
            else reject(errMessage)
        }, success ? timeoutForFulfilled : timeoutForRejected);
    })
}
