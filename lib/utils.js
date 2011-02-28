// this chain expects either async functions (argument length == 1), or non-async (argument length == 0)
exports.chain = function chain(fns, args, done) {
  var self = this,
      results = [],
      i = 0
  

  if(done === undefined) {
    done = args
    args = []
  }
    
  function result(answer){
    if(answer === false) return done(results)
    results[i] = answer
    
    i++ 
    if(i == fns.length) return done(results)
    run.call(self, fns[i])
  }
  
  var async_args = args.concat([result])
  
  function run(fn) {
    if(fn.async)
      fn.apply(self, async_args)
    else {
      var n = fn.apply(self, args)
      result(n)
    }
  }
  run.call(self, fns[0])
}


function Promise(context) { 
  this.context = context 
}
Promise.prototype.invoke = function() {
  if(!this._complete) return
  this._complete.apply(this.context, arguments)
}
Promise.prototype.complete = function(cb) {
  this._complete = cb
}

exports.promise = Promise