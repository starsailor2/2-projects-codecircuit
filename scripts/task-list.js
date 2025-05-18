// Task List Functionality
let tasks = [];

function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    renderTasks();
    updateTaskProgress();
    
    // Add event listeners
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('task-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
}

function addTask() {
    const taskInput = document.getElementById('task-input');
    const prioritySelect = document.getElementById('task-priority');
    
    const taskText = taskInput.value.trim();
    if (taskText === '') return;
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        priority: prioritySelect.value,
        completed: false
    };
    
    tasks.push(newTask);
    saveTasks();
    
    taskInput.value = '';
    taskInput.focus();
}

function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    updateTaskProgress();
}

function renderTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    tasksContainer.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('li');
        taskElement.className = `task-item ${task.priority}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
        
        const textSpan = document.createElement('span');
        textSpan.className = `task-text ${task.completed ? 'completed' : ''}`;
        textSpan.textContent = task.text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        taskElement.appendChild(checkbox);
        taskElement.appendChild(textSpan);
        taskElement.appendChild(deleteBtn);
        tasksContainer.appendChild(taskElement);
    });
}

function updateTaskProgress() {
    if (tasks.length === 0) {
        document.querySelector('.progress-filled').style.width = '0%';
        document.querySelector('.progress-text').textContent = '0% complete';
        return;
    }
    
    const completedTasks = tasks.filter(task => task.completed).length;
    const progressPercentage = Math.round((completedTasks / tasks.length) * 100);
    
    document.querySelector('.progress-filled').style.width = `${progressPercentage}%`;
    document.querySelector('.progress-text').textContent = `${progressPercentage}% complete`;
}
