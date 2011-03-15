
module.exports = function(store) {
  var Task = require("../..")[store]("Task", {
    id: { type: "number", auto_inc: true },
    user: { type: "string", required: "true" },
    created_at: { type: "date" },
    title: { type:"string", "default": "no title!" },
    keywords: { type:"json", "default": ["books"] },
  })

  Task.bind("saving", function updateCreatedAt(done) {
    this.created_at || (this.created_at = new Date())
    delete this.__test_saved
    done()
  }, true) // async

  Task.bind("saved", function() {
    this.__test_saved = true
  }) // async

  Task.bind("initialize", function(done) {
    this.__test_initialize = true
    done()
  }, true)  

  Task.bind("creating", function() {
    this.__test_creating = true
  })
  
  Task.bind("created", function() {
    this.__test_created = true
  })
  
  return Task
}