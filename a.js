const arr = [1, 2]

const toPromiseArr = [10, 11, 12, 13]


function doPromiseStuff(arr) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(arr.map(el => el += 1))
    }, 1500)
  })
}

const doStuff = async () => {
  const a = await arr.reduce((resolver) => {
    return resolver.then(resolvedArr => doPromiseStuff(resolvedArr).then(plussedArr => plussedArr))
  }, Promise.resolve(toPromiseArr))
  console.log(a)
}

doStuff()
