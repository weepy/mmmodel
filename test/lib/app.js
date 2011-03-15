var express = require("express"),
    app = express.createServer(),
    Task = require("./task")("memory") 

// find
app.get("/tasks/:id", function(req, res) {
  Task.find(req.param("id"), function(task) {
    res.send(task ? task.toJSON() : null)
  })
})

// query
app.get("/tasks", function(req, res) {
  // query's are project dependant - this test just returns them all ...
  Task.all(function(tasks) {
    res.send(JSON.stringify(tasks))
  })
})

// save / update
app.post("/tasks/save", function(req, res) {
  var o = JSON.parse(req.param("json"))

  var task = new Task(o)      
    
  task.save(function(ok) {
    res.send(task.toJSON())
  })
})

// destroy
app.post("/tasks/:id/destroy", function(req, res) { 
  Task.destroy(req.param("id"), function(ok) {
    res.send(JSON.stringify(ok))
  })
})

module.exports = app