import api from '../utils/api';
import { TASK_END_POINTS } from '../utils/constants';
import { AxiosResponse } from 'axios';

export interface Task {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    clientName: string;
    relatedCaseId?: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    status?: 'Pending' | 'In Progress' | 'Completed';
    assignedTo: string;
    notes?: string;
    tags?: string[];
    reminders?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

export const getTasks = async (): Promise<Task[]> => {
    try {
        
        // Add query parameters to ensure we get all task fields including priority and status
        const response: AxiosResponse<{ tasks?: Task[], data?: Task[], success?: boolean } | Task[]> = await api.get(TASK_END_POINTS.GET_ALL_TASKS, {
            params: {
                fields: 'title,description,clientName,relatedCaseId,dueDate,priority,status,assignedTo,notes,tags,reminders,createdAt,updatedAt'
            }
        });
        
        // Handle different response structures
        let tasks: Task[];
        if (Array.isArray(response.data)) {
            tasks = response.data;
        } else if (response.data && response.data.tasks) {
            tasks = response.data.tasks;
        } else if (response.data && response.data.data) {
            tasks = response.data.data;
        } else {
            tasks = [];
        }
        
        // Ensure each task has default values for priority and status if missing
        tasks = tasks.map(task => ({
            ...task,
            priority: task.priority || 'Medium',
            status: task.status || 'Pending'
        }));
        
        return tasks;
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        if (error instanceof Error) {
            console.error('Error fetching tasks:', error.message);
            throw new Error(`Failed to fetch tasks: ${error.message}`);
        }
        throw new Error('Failed to fetch tasks due to an unknown error');
    }
};

export const createTask = async (taskData: Omit<Task, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    try {
        
        const response: AxiosResponse<{ task?: Task, data?: Task, success?: boolean } | Task> = await api.post(TASK_END_POINTS.CREATE_TASK, {
            ...taskData,
            status: taskData.status || 'Pending' // Default status if not provided
        });
        
        
        // Handle different response structures
        let createdTask: Task;
        if (response.data && typeof response.data === 'object' && 'title' in response.data) {
            createdTask = response.data as Task;
        } else if (response.data && response.data.task) {
            createdTask = response.data.task;
        } else if (response.data && response.data.data) {
            createdTask = response.data.data;
        } else {
            throw new Error('Invalid response format from create task API');
        }
        
        return createdTask;
    } catch (error: any) {
        console.error('❌ Error creating task:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error headers:', error.response?.headers);
        
        if (error.response?.data) {
            const errorMessage = error.response.data.error?.message || error.response.data.message || 'Unknown error';
            throw new Error(`Failed to create task: ${errorMessage}`);
        } else if (error instanceof Error) {
            throw new Error(`Failed to create task: ${error.message}`);
        }
        throw new Error('Failed to create task due to an unknown error');
    }
};

export const updateTask = async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
    try {
        
        const response: AxiosResponse<{ task?: Task, data?: Task, success?: boolean } | Task> = await api.put(
            TASK_END_POINTS.UPDATE_TASK.replace(':id', taskId), 
            taskData
        );
        
        
        // Handle different response structures
        let updatedTask: Task;
        if (response.data && typeof response.data === 'object' && 'title' in response.data) {
            updatedTask = response.data as Task;
        } else if (response.data && response.data.task) {
            updatedTask = response.data.task;
        } else if (response.data && response.data.data) {
            updatedTask = response.data.data;
        } else {
            throw new Error('Invalid response format from update task API');
        }
        
        return updatedTask;
    } catch (error) {
        console.error('❌ Error updating task:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to update task: ${error.message}`);
        }
        throw new Error('Failed to update task due to an unknown error');
    }
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
        
        const response = await api.delete(TASK_END_POINTS.DELETE_TASK.replace(':id', taskId));
        
        
        return true;
    } catch (error) {
        console.error('❌ Error deleting task:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to delete task: ${error.message}`);
        }
        throw new Error('Failed to delete task due to an unknown error');
    }
};

export const getTaskById = async (taskId: string): Promise<Task> => {
    try {
        
        const response: AxiosResponse<{ task?: Task, data?: Task, success?: boolean } | Task> = await api.get(
            TASK_END_POINTS.GET_TASK_BY_ID.replace(':id', taskId)
        );
        
        
        // Handle different response structures
        let task: Task;
        if (response.data && typeof response.data === 'object' && 'title' in response.data) {
            task = response.data as Task;
        } else if (response.data && response.data.task) {
            task = response.data.task;
        } else if (response.data && response.data.data) {
            task = response.data.data;
        } else {
            throw new Error('Task not found');
        }
        
        return task;
    } catch (error) {
        console.error('❌ Error fetching task:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch task: ${error.message}`);
        }
        throw new Error('Failed to fetch task due to an unknown error');
    }
};
