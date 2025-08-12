import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Check, Calendar, Target, ChevronDown } from 'lucide-react';

const TodoCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [todos, setTodos] = useState({});
    const [weekPlans, setWeekPlans] = useState({});
    const [newTask, setNewTask] = useState('');
    const [newGoal, setNewGoal] = useState('');
    const [newPriority, setNewPriority] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showWeekModal, setShowWeekModal] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [expandedTasks, setExpandedTasks] = useState(new Set());
    const [expandedGoals, setExpandedGoals] = useState(new Set());
    const [expandedPriorities, setExpandedPriorities] = useState(new Set());
    const [subTaskInputs, setSubTaskInputs] = useState({});
    const [subGoalInputs, setSubGoalInputs] = useState({});
    const [subPriorityInputs, setSubPriorityInputs] = useState({});

    // Load data from localStorage on component mount
    useEffect(() => {
        try {
            const savedTodos = localStorage.getItem('todoCalendar_todos');
            const savedWeekPlans = localStorage.getItem('todoCalendar_weekPlans');

            if (savedTodos) {
                setTodos(JSON.parse(savedTodos));
            }

            if (savedWeekPlans) {
                setWeekPlans(JSON.parse(savedWeekPlans));
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
    }, []);

    // Save todos to localStorage whenever todos state changes
    useEffect(() => {
        try {
            localStorage.setItem('todoCalendar_todos', JSON.stringify(todos));
        } catch (error) {
            console.error('Error saving todos to localStorage:', error);
        }
    }, [todos]);

    // Save weekPlans to localStorage whenever weekPlans state changes
    useEffect(() => {
        try {
            localStorage.setItem('todoCalendar_weekPlans', JSON.stringify(weekPlans));
        } catch (error) {
            console.error('Error saving weekPlans to localStorage:', error);
        }
    }, [weekPlans]);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get calendar data for current month
    const getCalendarData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const current = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return { days, firstDay, lastDay };
    };

    // Navigate months
    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    // Get date key for storage
    const getDateKey = (date) => {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };

    // Get default tasks
    const getDefaultTasks = () => [
        { id: 'wake-up', text: '🌅 Wake up time', completed: false, isDefault: true, time: '', subTasks: [] },
        { id: 'wind-down', text: '🌙 Wind down time', completed: false, isDefault: true, time: '', subTasks: [] },
        { id: 'bedtime', text: '😴 Bedtime', completed: false, isDefault: true, time: '', subTasks: [] }
    ];

    // Get all tasks for a date with proper ordering
    const getTasksForDate = (dateKey) => {
        const storedTasks = todos[dateKey] || [];
        const defaults = getDefaultTasks();

        // Ensure default tasks exist
        const allTasks = [];

        // Add default tasks (checking if they already exist in storage)
        defaults.forEach(defaultTask => {
            const existing = storedTasks.find(task => task.id === defaultTask.id);
            allTasks.push(existing || defaultTask);
        });

        // Add custom tasks
        const customTasks = storedTasks.filter(task => !task.isDefault);
        allTasks.push(...customTasks);

        // Separate tasks with times and without times
        const tasksWithTime = allTasks.filter(task => task.time);
        const tasksWithoutTime = allTasks.filter(task => !task.time);

        // Sort tasks with times chronologically
        tasksWithTime.sort((a, b) => {
            const timeToMinutes = (timeStr) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return hours * 60 + minutes;
            };
            return timeToMinutes(a.time) - timeToMinutes(b.time);
        });

        // For tasks without time: wake up first, then customs, then wind down, then bedtime
        const wakeUp = tasksWithoutTime.filter(task => task.id === 'wake-up');
        const customs = tasksWithoutTime.filter(task => !task.isDefault);
        const windDown = tasksWithoutTime.filter(task => task.id === 'wind-down');
        const bedtime = tasksWithoutTime.filter(task => task.id === 'bedtime');

        const untimedOrdered = [...wakeUp, ...customs, ...windDown, ...bedtime];

        // Combine: all timed tasks in chronological order, then untimed tasks
        return [...tasksWithTime, ...untimedOrdered];
    };

    // Get completion color
    const getCompletionColor = (dateKey) => {
        const allTasks = getTasksForDate(dateKey);
        if (allTasks.length === 0) return 'bg-white';

        const completed = allTasks.filter(todo => todo.completed).length;
        const total = allTasks.length;
        const percentage = completed / total;

        if (percentage === 0) return 'bg-gray-50';
        if (percentage <= 0.33) return 'bg-green-100';
        if (percentage <= 0.66) return 'bg-green-200';
        if (percentage < 1) return 'bg-green-300';
        return 'bg-green-400';
    };

    // Get week key for storage
    const getWeekKey = (weekNumber) => {
        return `${currentDate.getFullYear()}-${currentDate.getMonth()}-week-${weekNumber}`;
    };

    // Open week modal
    const openWeekModal = (weekNumber) => {
        setSelectedWeek(weekNumber);
        setShowWeekModal(true);
        setNewGoal('');
        setNewPriority('');
    };

    // Add new goal
    const addGoal = () => {
        if (!newGoal.trim() || selectedWeek === null) return;

        const weekKey = getWeekKey(selectedWeek);
        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                goals: [
                    ...(prev[weekKey]?.goals || []),
                    { id: Date.now(), text: newGoal.trim(), completed: false, subItems: [] }
                ]
            }
        }));
        setNewGoal('');
    };

    // Add sub-goal
    const addSubGoal = (weekKey, parentGoalId, subGoalText) => {
        if (!subGoalText.trim()) return;

        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                goals: (prev[weekKey]?.goals || []).map(goal =>
                    goal.id === parentGoalId
                        ? {
                            ...goal,
                            subItems: [
                                ...(goal.subItems || []),
                                { id: Date.now(), text: subGoalText.trim(), completed: false }
                            ]
                        }
                        : goal
                )
            }
        }));
    };

    // Toggle sub-goal completion
    const toggleSubGoal = (weekKey, parentGoalId, subGoalId) => {
        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                goals: (prev[weekKey]?.goals || []).map(goal =>
                    goal.id === parentGoalId
                        ? {
                            ...goal,
                            subItems: (goal.subItems || []).map(subItem =>
                                subItem.id === subGoalId ? { ...subItem, completed: !subItem.completed } : subItem
                            )
                        }
                        : goal
                )
            }
        }));
    };

    // Delete sub-goal
    const deleteSubGoal = (weekKey, parentGoalId, subGoalId) => {
        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                goals: (prev[weekKey]?.goals || []).map(goal =>
                    goal.id === parentGoalId
                        ? {
                            ...goal,
                            subItems: (goal.subItems || []).filter(subItem => subItem.id !== subGoalId)
                        }
                        : goal
                )
            }
        }));
    };

    // Add new priority
    const addPriority = () => {
        if (!newPriority.trim() || selectedWeek === null) return;

        const weekKey = getWeekKey(selectedWeek);
        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                priorities: [
                    ...(prev[weekKey]?.priorities || []),
                    { id: Date.now(), text: newPriority.trim(), completed: false, subItems: [] }
                ]
            }
        }));
        setNewPriority('');
    };

    // Add sub-priority
    const addSubPriority = (weekKey, parentPriorityId, subPriorityText) => {
        if (!subPriorityText.trim()) return;

        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                priorities: (prev[weekKey]?.priorities || []).map(priority =>
                    priority.id === parentPriorityId
                        ? {
                            ...priority,
                            subItems: [
                                ...(priority.subItems || []),
                                { id: Date.now(), text: subPriorityText.trim(), completed: false }
                            ]
                        }
                        : priority
                )
            }
        }));
    };

    // Toggle sub-priority completion
    const toggleSubPriority = (weekKey, parentPriorityId, subPriorityId) => {
        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                priorities: (prev[weekKey]?.priorities || []).map(priority =>
                    priority.id === parentPriorityId
                        ? {
                            ...priority,
                            subItems: (priority.subItems || []).map(subItem =>
                                subItem.id === subPriorityId ? { ...subItem, completed: !subItem.completed } : subItem
                            )
                        }
                        : priority
                )
            }
        }));
    };

    // Delete sub-priority
    const deleteSubPriority = (weekKey, parentPriorityId, subPriorityId) => {
        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                priorities: (prev[weekKey]?.priorities || []).map(priority =>
                    priority.id === parentPriorityId
                        ? {
                            ...priority,
                            subItems: (priority.subItems || []).filter(subItem => subItem.id !== subPriorityId)
                        }
                        : priority
                )
            }
        }));
    };

    // Toggle goal/priority completion
    const toggleWeekItem = (weekKey, itemId, type) => {
        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                [type]: prev[weekKey]?.[type]?.map(item =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                ) || []
            }
        }));
    };

    // Delete week item (goals/priorities)
    const deleteWeekItem = (weekKey, itemId, type) => {
        setWeekPlans(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                [type]: prev[weekKey]?.[type]?.filter(item => item.id !== itemId) || []
            }
        }));
    };

    // Open modal for selected date
    const openModal = (date) => {
        setSelectedDate(date);
        setShowModal(true);
        setNewTask('');
    };

    // Add new task
    const addTask = () => {
        if (!newTask.trim() || !selectedDate) return;

        const dateKey = getDateKey(selectedDate);
        setTodos(prev => ({
            ...prev,
            [dateKey]: [
                ...(prev[dateKey] || []),
                { id: Date.now(), text: newTask.trim(), completed: false, isDefault: false, time: '', subTasks: [] }
            ]
        }));
        setNewTask('');
    };

    // Add sub-task
    const addSubTask = (dateKey, parentTaskId, subTaskText) => {
        if (!subTaskText.trim()) return;

        setTodos(prev => {
            const existingTasks = prev[dateKey] || [];
            const taskExists = existingTasks.find(task => task.id === parentTaskId);

            if (taskExists) {
                // Update existing task
                return {
                    ...prev,
                    [dateKey]: existingTasks.map(task =>
                        task.id === parentTaskId
                            ? {
                                ...task,
                                subTasks: [
                                    ...(task.subTasks || []),
                                    { id: Date.now(), text: subTaskText.trim(), completed: false }
                                ]
                            }
                            : task
                    )
                };
            } else {
                // Create default task if it doesn't exist
                const defaultTask = getDefaultTasks().find(task => task.id === parentTaskId);
                if (defaultTask) {
                    return {
                        ...prev,
                        [dateKey]: [
                            ...existingTasks,
                            {
                                ...defaultTask,
                                subTasks: [
                                    { id: Date.now(), text: subTaskText.trim(), completed: false }
                                ]
                            }
                        ]
                    };
                }
                return prev;
            }
        });
    };

    // Toggle sub-task completion
    const toggleSubTask = (dateKey, parentTaskId, subTaskId) => {
        setTodos(prev => {
            const existingTasks = prev[dateKey] || [];
            const taskExists = existingTasks.find(task => task.id === parentTaskId);

            if (taskExists) {
                return {
                    ...prev,
                    [dateKey]: existingTasks.map(task =>
                        task.id === parentTaskId
                            ? {
                                ...task,
                                subTasks: (task.subTasks || []).map(subTask =>
                                    subTask.id === subTaskId ? { ...subTask, completed: !subTask.completed } : subTask
                                )
                            }
                            : task
                    )
                };
            } else {
                // Create default task if it doesn't exist
                const defaultTask = getDefaultTasks().find(task => task.id === parentTaskId);
                if (defaultTask) {
                    return {
                        ...prev,
                        [dateKey]: [
                            ...existingTasks,
                            {
                                ...defaultTask,
                                subTasks: [
                                    { id: subTaskId, text: '', completed: true }
                                ]
                            }
                        ]
                    };
                }
                return prev;
            }
        });
    };

    // Delete sub-task
    const deleteSubTask = (dateKey, parentTaskId, subTaskId) => {
        setTodos(prev => {
            const existingTasks = prev[dateKey] || [];
            const taskExists = existingTasks.find(task => task.id === parentTaskId);

            if (taskExists) {
                return {
                    ...prev,
                    [dateKey]: existingTasks.map(task =>
                        task.id === parentTaskId
                            ? {
                                ...task,
                                subTasks: (task.subTasks || []).filter(subTask => subTask.id !== subTaskId)
                            }
                            : task
                    )
                };
            }
            return prev;
        });
    };

    // Toggle task completion
    const toggleTask = (dateKey, taskId) => {
        setTodos(prev => {
            const existingTasks = prev[dateKey] || [];
            const taskExists = existingTasks.find(task => task.id === taskId);

            if (taskExists) {
                return {
                    ...prev,
                    [dateKey]: existingTasks.map(task =>
                        task.id === taskId ? { ...task, completed: !task.completed } : task
                    )
                };
            } else {
                // Create default task if it doesn't exist
                const defaultTask = getDefaultTasks().find(task => task.id === taskId);
                if (defaultTask) {
                    return {
                        ...prev,
                        [dateKey]: [
                            ...existingTasks,
                            { ...defaultTask, completed: true }
                        ]
                    };
                }
                return prev;
            }
        });
    };

    // Update task time
    const updateTaskTime = (dateKey, taskId, time) => {
        setTodos(prev => {
            const existingTasks = prev[dateKey] || [];
            const taskExists = existingTasks.find(task => task.id === taskId);

            if (taskExists) {
                return {
                    ...prev,
                    [dateKey]: existingTasks.map(task =>
                        task.id === taskId ? { ...task, time } : task
                    )
                };
            } else {
                // Create default task if it doesn't exist
                const defaultTask = getDefaultTasks().find(task => task.id === taskId);
                if (defaultTask) {
                    return {
                        ...prev,
                        [dateKey]: [
                            ...existingTasks,
                            { ...defaultTask, time }
                        ]
                    };
                }
                return prev;
            }
        });
    };

    // Delete task
    const deleteTask = (dateKey, taskId) => {
        setTodos(prev => ({
            ...prev,
            [dateKey]: prev[dateKey].filter(task => task.id !== taskId)
        }));
    };

    // Get week planning status
    const getWeekPlanningStatus = (weekNumber) => {
        const weekKey = getWeekKey(weekNumber);
        const plans = weekPlans[weekKey];
        if (!plans) return { hasPlans: false, completedGoals: 0, totalGoals: 0, completedPriorities: 0, totalPriorities: 0 };

        const goals = plans.goals || [];
        const priorities = plans.priorities || [];

        return {
            hasPlans: goals.length > 0 || priorities.length > 0,
            completedGoals: goals.filter(g => g.completed).length,
            totalGoals: goals.length,
            completedPriorities: priorities.filter(p => p.completed).length,
            totalPriorities: priorities.length
        };
    };

    const { days } = getCalendarData();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-800 to-purple-900 p-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <h1 className="text-3xl font-bold text-white">
                            {months[currentMonth]} {currentYear}
                        </h1>

                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
                    {/* Days of week header */}
                    <div className="grid grid-cols-8 gap-2 mb-4">
                        <div className="text-center text-white font-semibold py-2 text-sm">
                            Week
                        </div>
                        {daysOfWeek.map(day => (
                            <div key={day} className="text-center text-white font-semibold py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days with week numbers */}
                    <div className="grid grid-cols-8 gap-2">
                        {(() => {
                            let weekCounter = 1;
                            return Array.from({ length: 6 }, (_, weekIndex) => {
                                const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7);
                                const currentMonthDaysInWeek = weekDays.filter(day => day.getMonth() === currentMonth).length;
                                const shouldShowWeekNumber = currentMonthDaysInWeek >= 3;
                                const displayWeekNumber = shouldShowWeekNumber ? weekCounter++ : null;
                                const weekStatus = displayWeekNumber ? getWeekPlanningStatus(displayWeekNumber) : null;

                                return (
                                    <React.Fragment key={weekIndex}>
                                        {/* Week number column */}
                                        <div className="flex items-center justify-center">
                                            {displayWeekNumber && (
                                                <button
                                                    onClick={() => openWeekModal(displayWeekNumber)}
                                                    className="w-10 h-10 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 flex flex-col items-center justify-center transition-all hover:scale-105 group"
                                                    title={`Week ${displayWeekNumber} Planning`}
                                                >
                                                    <span className="text-white text-sm font-medium">
                                                        {displayWeekNumber}
                                                    </span>
                                                    {weekStatus?.hasPlans && (
                                                        <div className="flex gap-0.5 mt-0.5">
                                                            {weekStatus.totalGoals > 0 && (
                                                                <div className={`w-1 h-1 rounded-full ${weekStatus.completedGoals === weekStatus.totalGoals && weekStatus.totalGoals > 0 ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                                                            )}
                                                            {weekStatus.totalPriorities > 0 && (
                                                                <div className={`w-1 h-1 rounded-full ${weekStatus.completedPriorities === weekStatus.totalPriorities && weekStatus.totalPriorities > 0 ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                                                            )}
                                                        </div>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Day boxes for this week */}
                                        {weekDays.map((day, dayIndex) => {
                                            const dateKey = getDateKey(day);
                                            const isCurrentMonth = day.getMonth() === currentMonth;
                                            const isToday = day.toDateString() === new Date().toDateString();
                                            const dayTodos = getTasksForDate(dateKey);

                                            return (
                                                <button
                                                    key={`${weekIndex}-${dayIndex}`}
                                                    onClick={() => openModal(day)}
                                                    className={`
                            aspect-square p-2 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg
                            ${getCompletionColor(dateKey)}
                            ${isCurrentMonth ? 'border-white border-opacity-30' : 'border-gray-400 border-opacity-20'}
                            ${isToday ? 'ring-2 ring-yellow-300' : ''}
                            ${!isCurrentMonth ? 'opacity-40' : ''}
                          `}
                                                >
                                                    <div className="h-full flex flex-col justify-between">
                                                        <span className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-800' : 'text-gray-500'}`}>
                                                            {day.getDate()}
                                                        </span>
                                                        {dayTodos.length > 0 && (
                                                            <div className="text-xs text-gray-600">
                                                                {dayTodos.filter(t => t.completed).length}/{dayTodos.length}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Week Planning Modal */}
                {showWeekModal && selectedWeek && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={24} />
                                        <h2 className="text-xl font-bold">
                                            {months[currentDate.getMonth()].toUpperCase()} WEEK {selectedWeek}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setShowWeekModal(false)}
                                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Goals and Priorities */}
                            <div className="p-6 grid grid-cols-2 gap-6 h-96 overflow-hidden">
                                {/* Goals Section */}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target size={20} className="text-blue-600" />
                                        <h3 className="text-lg font-bold text-gray-800">GOALS</h3>
                                    </div>

                                    {/* Add Goal */}
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={newGoal}
                                            onChange={(e) => setNewGoal(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                                            placeholder="Add a goal..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={addGoal}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {/* Goals List */}
                                    <div className="flex-1 overflow-y-auto">
                                        {(weekPlans[getWeekKey(selectedWeek)]?.goals || []).map(goal => (
                                            <div key={goal.id} className="mb-3">
                                                {/* Main Goal */}
                                                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                                    <button
                                                        onClick={() => toggleWeekItem(getWeekKey(selectedWeek), goal.id, 'goals')}
                                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                              ${goal.completed
                                                                ? 'bg-green-500 border-green-500 text-white'
                                                                : 'border-gray-300 hover:border-green-400'
                                                            }`}
                                                    >
                                                        {goal.completed && <Check size={12} />}
                                                    </button>

                                                    <div className="flex-1 flex items-center gap-2">
                                                        <span className={`${goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                            {goal.text}
                                                        </span>

                                                        {/* Expand/Collapse button */}
                                                        <button
                                                            onClick={() => {
                                                                setExpandedGoals(prev => {
                                                                    const newSet = new Set(prev);
                                                                    if (newSet.has(goal.id)) {
                                                                        newSet.delete(goal.id);
                                                                    } else {
                                                                        newSet.add(goal.id);
                                                                    }
                                                                    return newSet;
                                                                });
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                                        >
                                                            {expandedGoals.has(goal.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => deleteWeekItem(getWeekKey(selectedWeek), goal.id, 'goals')}
                                                        className="flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                {/* Sub-goals */}
                                                {expandedGoals.has(goal.id) && (
                                                    <div className="ml-8 mt-2 border-l-2 border-blue-200 pl-4">
                                                        {/* Add sub-goal input */}
                                                        <div className="flex gap-2 mb-2">
                                                            <input
                                                                type="text"
                                                                value={subGoalInputs[goal.id] || ''}
                                                                onChange={(e) => setSubGoalInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        addSubGoal(getWeekKey(selectedWeek), goal.id, subGoalInputs[goal.id] || '');
                                                                        setSubGoalInputs(prev => ({ ...prev, [goal.id]: '' }));
                                                                    }
                                                                }}
                                                                placeholder="Add sub-goal..."
                                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    addSubGoal(getWeekKey(selectedWeek), goal.id, subGoalInputs[goal.id] || '');
                                                                    setSubGoalInputs(prev => ({ ...prev, [goal.id]: '' }));
                                                                }}
                                                                className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                                            >
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>

                                                        {/* Sub-goals list */}
                                                        {(goal.subItems || []).map(subGoal => (
                                                            <div key={subGoal.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded mb-1">
                                                                <button
                                                                    onClick={() => toggleSubGoal(getWeekKey(selectedWeek), goal.id, subGoal.id)}
                                                                    className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                    ${subGoal.completed
                                                                            ? 'bg-green-500 border-green-500 text-white'
                                                                            : 'border-gray-300 hover:border-green-400'
                                                                        }`}
                                                                >
                                                                    {subGoal.completed && <Check size={10} />}
                                                                </button>

                                                                <span className={`flex-1 text-sm ${subGoal.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                                                    {subGoal.text}
                                                                </span>

                                                                <button
                                                                    onClick={() => deleteSubGoal(getWeekKey(selectedWeek), goal.id, subGoal.id)}
                                                                    className="flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {(weekPlans[getWeekKey(selectedWeek)]?.goals || []).length === 0 && (
                                            <div className="text-center text-gray-500 py-8">
                                                No goals set for this week
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Priorities Section */}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target size={20} className="text-orange-600" />
                                        <h3 className="text-lg font-bold text-gray-800">PRIORITIES</h3>
                                    </div>

                                    {/* Add Priority */}
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={newPriority}
                                            onChange={(e) => setNewPriority(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addPriority()}
                                            placeholder="Add a priority..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        <button
                                            onClick={addPriority}
                                            className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {/* Priorities List */}
                                    <div className="flex-1 overflow-y-auto">
                                        {(weekPlans[getWeekKey(selectedWeek)]?.priorities || []).map(priority => (
                                            <div key={priority.id} className="mb-3">
                                                {/* Main Priority */}
                                                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                                    <button
                                                        onClick={() => toggleWeekItem(getWeekKey(selectedWeek), priority.id, 'priorities')}
                                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                              ${priority.completed
                                                                ? 'bg-green-500 border-green-500 text-white'
                                                                : 'border-gray-300 hover:border-green-400'
                                                            }`}
                                                    >
                                                        {priority.completed && <Check size={12} />}
                                                    </button>

                                                    <div className="flex-1 flex items-center gap-2">
                                                        <span className={`${priority.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                            {priority.text}
                                                        </span>

                                                        {/* Expand/Collapse button */}
                                                        <button
                                                            onClick={() => {
                                                                setExpandedPriorities(prev => {
                                                                    const newSet = new Set(prev);
                                                                    if (newSet.has(priority.id)) {
                                                                        newSet.delete(priority.id);
                                                                    } else {
                                                                        newSet.add(priority.id);
                                                                    }
                                                                    return newSet;
                                                                });
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                                        >
                                                            {expandedPriorities.has(priority.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => deleteWeekItem(getWeekKey(selectedWeek), priority.id, 'priorities')}
                                                        className="flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                {/* Sub-priorities */}
                                                {expandedPriorities.has(priority.id) && (
                                                    <div className="ml-8 mt-2 border-l-2 border-orange-200 pl-4">
                                                        {/* Add sub-priority input */}
                                                        <div className="flex gap-2 mb-2">
                                                            <input
                                                                type="text"
                                                                value={subPriorityInputs[priority.id] || ''}
                                                                onChange={(e) => setSubPriorityInputs(prev => ({ ...prev, [priority.id]: e.target.value }))}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        addSubPriority(getWeekKey(selectedWeek), priority.id, subPriorityInputs[priority.id] || '');
                                                                        setSubPriorityInputs(prev => ({ ...prev, [priority.id]: '' }));
                                                                    }
                                                                }}
                                                                placeholder="Add sub-priority..."
                                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    addSubPriority(getWeekKey(selectedWeek), priority.id, subPriorityInputs[priority.id] || '');
                                                                    setSubPriorityInputs(prev => ({ ...prev, [priority.id]: '' }));
                                                                }}
                                                                className="px-2 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                                                            >
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>

                                                        {/* Sub-priorities list */}
                                                        {(priority.subItems || []).map(subPriority => (
                                                            <div key={subPriority.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded mb-1">
                                                                <button
                                                                    onClick={() => toggleSubPriority(getWeekKey(selectedWeek), priority.id, subPriority.id)}
                                                                    className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                    ${subPriority.completed
                                                                            ? 'bg-green-500 border-green-500 text-white'
                                                                            : 'border-gray-300 hover:border-green-400'
                                                                        }`}
                                                                >
                                                                    {subPriority.completed && <Check size={10} />}
                                                                </button>

                                                                <span className={`flex-1 text-sm ${subPriority.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                                                    {subPriority.text}
                                                                </span>

                                                                <button
                                                                    onClick={() => deleteSubPriority(getWeekKey(selectedWeek), priority.id, subPriority.id)}
                                                                    className="flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {(weekPlans[getWeekKey(selectedWeek)]?.priorities || []).length === 0 && (
                                            <div className="text-center text-gray-500 py-8">
                                                No priorities set for this week
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Daily Task Modal */}
                {showModal && selectedDate && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">
                                        {selectedDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Add Task Section */}
                            <div className="p-4 border-b">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTask}
                                        onChange={(e) => setNewTask(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                        placeholder="Add a new task..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        onClick={addTask}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Tasks List */}
                            <div className="p-4 max-h-96 overflow-y-auto">
                                {getTasksForDate(getDateKey(selectedDate)).map(task => (
                                    <div key={task.id} className="mb-3">
                                        {/* Main Task */}
                                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border-b border-gray-100">
                                            <button
                                                onClick={() => toggleTask(getDateKey(selectedDate), task.id)}
                                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${task.completed
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'border-gray-300 hover:border-green-400'
                                                    }`}
                                            >
                                                {task.completed && <Check size={12} />}
                                            </button>

                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                        {task.text}
                                                    </span>

                                                    {/* Expand/Collapse button */}
                                                    <button
                                                        onClick={() => {
                                                            setExpandedTasks(prev => {
                                                                const newSet = new Set(prev);
                                                                if (newSet.has(task.id)) {
                                                                    newSet.delete(task.id);
                                                                } else {
                                                                    newSet.add(task.id);
                                                                }
                                                                return newSet;
                                                            });
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                                    >
                                                        {expandedTasks.has(task.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                </div>

                                                {/* TIME INPUT */}
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={task.time || ''}
                                                        onChange={(e) => {
                                                            updateTaskTime(getDateKey(selectedDate), task.id, e.target.value);
                                                        }}
                                                        className="text-xs px-2 py-1 border border-gray-300 rounded w-20 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                        placeholder="Time"
                                                    />
                                                    {task.time && (
                                                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                                            {task.time}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {!task.isDefault && (
                                                <button
                                                    onClick={() => deleteTask(getDateKey(selectedDate), task.id)}
                                                    className="flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Sub-tasks */}
                                        {expandedTasks.has(task.id) && (
                                            <div className="ml-8 mt-2 border-l-2 border-gray-200 pl-4">
                                                {/* Add sub-task input */}
                                                <div className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={subTaskInputs[task.id] || ''}
                                                        onChange={(e) => setSubTaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                addSubTask(getDateKey(selectedDate), task.id, subTaskInputs[task.id] || '');
                                                                setSubTaskInputs(prev => ({ ...prev, [task.id]: '' }));
                                                            }
                                                        }}
                                                        placeholder="Add sub-task..."
                                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            addSubTask(getDateKey(selectedDate), task.id, subTaskInputs[task.id] || '');
                                                            setSubTaskInputs(prev => ({ ...prev, [task.id]: '' }));
                                                        }}
                                                        className="px-2 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>

                                                {/* Sub-tasks list */}
                                                {(task.subTasks || []).map(subTask => (
                                                    <div key={subTask.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded mb-1">
                                                        <button
                                                            onClick={() => toggleSubTask(getDateKey(selectedDate), task.id, subTask.id)}
                                                            className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                ${subTask.completed
                                                                    ? 'bg-green-500 border-green-500 text-white'
                                                                    : 'border-gray-300 hover:border-green-400'
                                                                }`}
                                                        >
                                                            {subTask.completed && <Check size={10} />}
                                                        </button>

                                                        <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                                            {subTask.text}
                                                        </span>

                                                        <button
                                                            onClick={() => deleteSubTask(getDateKey(selectedDate), task.id, subTask.id)}
                                                            className="flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {getTasksForDate(getDateKey(selectedDate)).length === 0 && (
                                    <div className="text-center text-gray-500 py-8">
                                        Add your first task above!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodoCalendar;