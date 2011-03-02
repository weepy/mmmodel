
function Task(o) {
  this.original = {}
  merge(this, o)
  merge(this.original, o)
  return
}

Task.properties = {
    id: { type: "number", auto_inc: true },
    user_id: {type: "string", required: true}, 
    text: {type: "string", required: true },
    week: { type: "number", required: true}, 
    day: { type: "number", required: true}, 
    done: { type: "number", "default": 0 },
    created_at: { type: "date" },
    updated_at: { type: "date" }
  }
  
// Task.prototype.save = function(cb) {
//   var o = {}, data
//   var props = ["id", "done", "text"]
//   
//   for(var i=0; i < props.length;i++) {
//     if(data = this[props[i]] == null) continue
//     o[props[i]] = data    
//   }
//   $.post("/tasks/save", {json: JSON.stringify(o)} function(data) {
//     var task = new Task(data)
//     cb(task)
//   })
// }



Task.prototype.toData = function() {
  var o = {}
  for(var name in Task.properties) {
    if(!(name in this)) continue
    o[name] = this[name]
  }
  return o   
}

Task.prototype.toJSON = function() {
  return JSON.stringify(this.toData())
}



Task.prototype.destroy = function(cb) {
  var task = this
  $.post("/tasks/destroy", {json: this.toJSON(), current_user: "jonah"}, function(text) {
    cb(text == "ok")
  })
}


Task.prototype.save = function(cb) {
  var task = this
  $.post("/tasks/save", {json: this.toJSON(), current_user: "jonah"}, function(text) {
    var o = JSON.parse(text)
    task.saved = true
    merge(task, o)
    merge(task.original, o)
    cb(task)
  })
}