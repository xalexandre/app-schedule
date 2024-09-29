'use client';
import styles from '../styles/home.module.css';
import PrivateRoute from '@/components/PrivateRoute';
import { useState, useEffect } from 'react';
import { format, parseISO, setDate } from 'date-fns';
import { addTaskToFirestore, removeTaskFromFirestore, AnalyticsInit, getTasksFromFirestore } from '../../public/utils/firebase';
import { addTask, getTasks } from '../../public/utils/indexedDb';

const requestNotificationPermission = () => {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendNotification('Notificações ativadas', 'Agora você receberá notificações.');
      }
    });
  }
};

const sendNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [completed, setCompleted] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const today = format(new Date(), 'yyyy-MM-dd');

  const loadTasks = async () => {
    try {
      const tasksFromDB = await getTasks(); 

      if (navigator.onLine) {
        const tasksFromFirestore = await getTasksFromFirestore(); 

        const tasksMap = new Map();
        tasksFromDB.forEach(task => tasksMap.set(task.id, task));
        tasksFromFirestore.forEach(task => {
          const exists = tasksMap.has(task.id);
          
          if(!exists){
            tasksMap.set(task.id, task);
          }
        });

        const mergedTasks = Array.from(tasksMap.values());

        await Promise.all(
          mergedTasks.map(async (task) => {
            try {
              if(!task.synced){
                await addTaskToFirestore(task);
                task.synced = true;
              }
              await addTask(task);
            } catch (error) {
              console.error('Erro ao adicionar tarefa durante a sincronização:', error);
            }
          })
        );

        setTasks(mergedTasks); 
      } else {
        setTasks(tasksFromDB); 
      }
    } catch (error) {
      console.error('Erro ao carregar e mesclar tarefas:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    const newTask = { 
      id: Date.now(), 
      title, 
      date: new Date(dateTime).toISOString(), 
      completed,
      synced: navigator.onLine,
    };

    try {
      if(navigator.onLine){
        const tasksFromFirestore = await getTasksFromFirestore();
        const exists = tasksFromFirestore.some(task => task.title  === newTask.title && task.date === newTask.date && task.completed === newTask.completed);
        if(!exists){
          await addTaskToFirestore(newTask);
        }
      }
      await addTask(newTask); 
      loadTasks(); 
    } catch (error) {
      console.error('Erro ao adicionar nova tarefa:', error);
    }

    setTitle('');
    setDateTime('');
    setCompleted(false);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      // Encontrar a tarefa que está sendo atualizada
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          task.completed = !task.completed; // Alternar o status de 'concluído'
        }
        return task;
      });
  
      const taskToUpdate = updatedTasks.find(task => task.id === taskId);
  
      if (navigator.onLine) {
        // Sincronizar com o Firestore se estiver online
        const tasksFromFirestore = await getTasksFromFirestore();
        const existsInFirestore = tasksFromFirestore.some(task => task.id === taskToUpdate.id);
  
        if (existsInFirestore) {
          // Atualizar a tarefa no Firestore
          await addTaskToFirestore(taskToUpdate);
        }
      }
  
      // Atualizar no IndexedDB independentemente do estado de conexão
      await addTask(taskToUpdate);
  
      // Atualizar o estado das tarefas na interface
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Erro ao marcar tarefa como concluída:', error);
    }
  };

  const handleRemoveTask = async (taskId) => {
    try {
      // Remover do IndexedDB
      console.log('ID da tarefa a ser removida:', taskId);

      const updatedTasks = tasks.filter(task => task.id !== taskId); // Filtrar as tarefas e remover a que tem o ID correspondente
  
      // Atualizar o estado de tarefas localmente
      setTasks(updatedTasks);
  
      if (navigator.onLine) {
        // Se estiver online, remover a tarefa também do Firestore
        const tasksFromFirestore = await getTasksFromFirestore();
        const existsInFirestore = tasksFromFirestore.some(task => task.id === taskId);
  
        if (existsInFirestore) {
          // Adicionar a lógica para remover a tarefa do Firestore
          await removeTaskFromFirestore(taskId);
        }
      }
  
      // Remover a tarefa do IndexedDB
      await removeTask(taskId); // Função para remover a tarefa localmente
  
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
    }
  };
  
  

  const groupByDate = (tasks) => {
    const grouped = tasks.reduce((groups, task) => {
      const taskDate = parseISO(task.date);
      const formattedDate = format(taskDate, 'yyyy-MM-dd');

      const displayDate = formattedDate >= today ? formattedDate : 'passadas';

      if (!groups[displayDate]) {
        groups[displayDate] = [];
      }
      groups[displayDate].push(task);
      return groups;
    }, {});

    Object.keys(grouped).forEach(eachDate => {
      grouped[eachDate].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
  });

  return grouped;
};

  const groupedTasks = groupByDate(tasks);

  useEffect(() => {
    requestNotificationPermission();
    loadTasks();

    const handleOfflineStatus = () => {
      if (!navigator.onLine) {
        setIsOffline(true);
        sendNotification('Você está offline', 'As tarefas adicionadas serão sincronizadas quando a conexão for restaurada.');
      } else {
        setIsOffline(false);
        sendNotification('Você está online', 'A conexão foi restabelecida.');
        loadTasks(); 
      }
    };

    window.addEventListener('online', handleOfflineStatus);
    window.addEventListener('offline', handleOfflineStatus);


    const loadAnalytics = async () => {
      await AnalyticsInit();
    }

    if(typeof window !== 'undefined'){
      loadAnalytics();
    }

    return () => {
      window.removeEventListener('online', handleOfflineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

return (
  <PrivateRoute>  
    <div className={styles.container}>
      <h1 className={styles.title}>Tasks</h1>
      <p className={styles.subtitle}>Control</p>
      {isOffline && (
        <div className='bg-red-500 text-white p-4 rounded mb-6'>
          You are offline, Tasks will be synced when connection is restored!
        </div>
      )}
      
      <div className={styles.inputContainer}>
        <form onSubmit={handleAddTask} className="mb-6">
          <input
            type="text"
            placeholder="Título"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            className={styles.input}
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
          <br></br>
          <label className="mr-2">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
            />{' '}
            Done
          </label>
          <button type='submit' className={styles.addButton}>+</button>
        </form>  
      </div>
      <h2 className="text-2xl mb-4">Tarefas</h2>
        {Object.keys(groupedTasks).filter(date => date !== 'passadas').map((date) => (
        
          <div key={date} className="mb-6">
            <h3 className="text-xl font-bold">
              {date === today ? 'Hoje' : format(parseISO(date), 'dd/MM/yyyy')}
            </h3>
            {groupedTasks[date].map((task) => (
              <div key={task.id} className={styles.taskItem}>
                <div className={styles.taskDetails}>
                  <p>{task.title} - {format(new Date(task.date), 'HH:mm')}</p>
                </div>
                <div className={styles.taskActions}>
                  <button onClick={() => handleCompleteTask(task.id)} className={styles.completeButton}>
                    {task.completed ? '✓' : 'I'}
                  </button>
                  <button onClick={() => handleRemoveTask(task.id)} className={styles.removeButton}>−</button>
                </div>
              </div>
            ))}
          </div>
        ))}
    
        <h2 className="text-2xl mb-4">Tarefas Passadas</h2>
        
          {groupedTasks['passadas']?.map((task) => (
            
            <div key={task.id} className={styles.taskItem}>
            <div className={styles.taskDetails}>
              <p>{task.title} - {format(new Date(task.date), 'HH:mm')}</p>
            </div>
            <div className={styles.taskActions}>
              <button onClick={() => handleCompleteTask(task.id)} className={styles.completeButton}>
                {task.completed ? '✓' : 'I'}
              </button>
              <button onClick={() => handleRemoveTask(task.id)} className={styles.removeButton}>−</button>
            </div>
          </div>
          ))}
    </div>
  </PrivateRoute>
);
}