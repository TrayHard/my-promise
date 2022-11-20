const MyPromise = require('./promise')

let p = new MyPromise(function (resolve, reject) {
  setTimeout(() => {
    console.log("timeout");
    reject(new Error('test error'));
    // resolve(5);
  }, 2000);
});

raceTest(
    new MyPromise((resolve, reject) => {
        return p.then(() => resolve(5))
    }),
    3000,
    'errMessage'
)

// p
//     .then((value) => {
//         console.log("then 1", value);
//         return value + 2;
//     })
//     .then((value) => {
//         console.log("then 2", value);
//         return value + 2;
//     })
//     .catch((error) => {
//         console.error("catch", error);
//     })





function raceTest(promise, time, errMessage) {
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(errMessage), time);
        })
    ])
}
