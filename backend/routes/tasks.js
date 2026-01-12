const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// Get All Tasks
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create Task
router.post('/', auth, async (req, res) => {
    const { title, description, category, dueDate, status } = req.body;
    try {
        const newTask = new Task({
            title,
            description,
            category,
            dueDate,
            status, // 'todo', 'inprogress', or 'done'
            user: req.user.id
        });
        const task = await newTask.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Task (Move between columns)
router.put('/:id', auth, async (req, res) => {
    const { title, description, category, dueDate, status } = req.body;
    const taskFields = {};
    if (title) taskFields.title = title;
    if (description) taskFields.description = description;
    if (category) taskFields.category = category;
    if (dueDate) taskFields.dueDate = dueDate;
    if (status) taskFields.status = status;

    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        
        // Ensure user owns task
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: taskFields },
            { new: true }
        );
        res.json(task);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete Task
router.delete('/:id', auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        
        // Ensure user owns task
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Task removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;