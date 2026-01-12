const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'General' },
    dueDate: { type: Date },
    // Added Status for the Kanban board
    status: { type: String, enum: ['todo', 'inprogress', 'done'], default: 'todo' }, 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('task', TaskSchema);