var express = require("express"),
    app = express.createServer(),
    Task = require("./task2") // we need a different version ! otherwise the different stores get clobbered
Task.setStore("memory")


// save / update
app.post("/tasks/save", function(req, res) {
  var o = JSON.parse(req.param("json"))
  var task = new Task(o)      
  task.save(function(ok) {
    res.send(task.toJSON())
  })
})

// find
app.get("/tasks/:id", function(req, res) {

  Task.find(req.param("id"), function(task) {
    res.send(task ? task.toJSON() : null)
  })
})

// destroy
app.post("/tasks/:id/destroy", function(req, res) { 
  Task.destroy(req.param("id"), function(ok) {
    res.send(JSON.stringify(ok))
  })
})

module.exports = app