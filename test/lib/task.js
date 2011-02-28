var Task = mmodel.create("Task", {
  id: { type: "number", auto_inc: true },
  user: { type: "string" },
  created_at: { type: "number" },
  title: { type:"string", default: "no title!" },
  keywords: { type:"json", default: ["books"] },
})

Task.bind("saving", function(done) {
  this.created_at = (this.created_at/1) || Date.now() // convert to number
  this._saved = true
  done()
}, true) // async

//Task.bind("saving", Task.propertyValidation)

Task.bind("saving", function() {
  this.user || this.error("no user")
})

Task.bind("initialize", function() {
  if(this.created_at) this.created_at = new Date(this.created_at) // convert from number
})

Task.bind("initialize", function(done) {
  this.test = 123
  done()
}, true)



module.exports = Task