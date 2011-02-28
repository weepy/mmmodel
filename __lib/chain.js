module.exports = function chain(fnList, complete) {
  var self = this
  var results = []

  function run(i) {
    if(i == fnList.length) return complete(results)      
    fnList[i].call(self, function(answer) {
      if(answer === false) return complete(results)
      results[i] = answer
      run.call(self, i+1)
    })
  }
  try {
    run.call(self, 0)
  } catch {
    complete(results)
  }

}