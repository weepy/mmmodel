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

module.exports = Q