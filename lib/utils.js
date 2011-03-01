var nextTick = (typeof process != "undefined") ? setTimeout : process.nextTick

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

exports.achain = function achain(fns, args, done) {
  for(var i in fns) fns[i].async = true
  exports.chain.call(this, fns, args, done)
}

exports.chain = function chain(fns, args, done) {
  var self = this,
      results = [],
      i = 0
    
  args || (args = [])
  function complete(err, results) {
    done.call(self, err, results )
  }
  
  function result(answer){
    if(answer === false) return complete(true, results)
    results[i] = answer
    
    i++ 
    if(i == fns.length) return complete(null, results)
    run(fns[i])
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
  
  if(fns.length == 0) return complete(null, results)
  run(fns[0])
}



function Q() {
  this.jobs = []
  return
}

Q.prototype._run = function() { 
  if(this.current) return
  this.current = this.jobs.shift()  
  if(!this.current) return
  this.current.job.call(this) //() //.call this.current.context
}

Q.prototype.complete = function(result) {  
  if(!this.current) {
   console.log("error result - when not running?!") 
   return
  }
  if(this.current.callback) this.current.callback(result) //.call(this.current.context, result)  
  this.current = null
  this._run()
}

Q.prototype.add = function(job, callback) {
  this.jobs.push({job: job, callback: callback})
  this._run()
}

exports.queue = Q

