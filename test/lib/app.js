var express = require("express"),
    app = express.createServer()

var Task = require("./task2")

Task.setStore("memory")

// app.configure(function() {
// 
//   // app.use(express.bodyDecoder())
//     app.use(express.logger())
// })

// 
// app.post("/tasks/update", auth, function(req, res) { 
//   var o = JSON.parse(req.param("json"))
//   new Task(o).update(o, function(ok) {
//     res.send(this.toJSON())
//   })
// })
//   

// app.get("/app", function(req, res) { 
//   res.send("hello")
// })

app.post("/tasks/save", function(req, res) {
  var o = JSON.parse(req.param("json"))
  var task = new Task(o)      
  task.save(function(ok) {
    res.send(task.toJSON())
  })
})

app.get("/tasks/:id", function(req, res) {

  Task.find(req.param("id"), function(task) {
    res.send(task ? task.toJSON() : null)
  })
})

// app.get("*", function(req, res) { 
//     console.log("x")
// })

// app.post("/tasks/destroy", auth, function(req, res) { 
//   var o = JSON.parse(req.param("json"))
//   
//   function err() { res.send("error");  }
//   function ok() { res.send("ok");  }
//   
//   Task.find(o.id, function(t) {
//     t ? t.destroy(ok) : err()
//   })
// })

module.exports = app