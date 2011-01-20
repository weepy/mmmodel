var Puzzle = mmodel.create("Puzzle", {
  id: { type: "number", auto_inc: true },
  user: {type: "string", required: true },
  fen: {type: "string", required: true, format: /([rnbqkpRNBQKP12345678]+\/){7}([rnbqkpRNBQKP12345678]+)/ },
  created_at: {type: "date"},
  updated_at: {type: "date"},
  title: {type:"string"},
  author: {type:"string"},
  description: {type:"string"},
  difficulty: {type:"string"},
  keywords: {type:"json"},
  solution: {type:"json", required: true},
  num_moves: {type:"number", required: true}
})

Puzzle.callback("beforeSave", function(done) {
  var self = this
  this.created_at = this.created_at || new Date()
  this.updated_at = new Date()

  done()
  // Puzzle.count(function(num) {
  //   self.id = num + 1
  //   done()
  // })
})

module.exports = Puzzle
