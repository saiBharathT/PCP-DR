import { LightningElement, wire ,track,api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getTasks from '@salesforce/apex/TaskController.getTasks';
import getStatusPicklistValues from '@salesforce/apex/TaskController.getStatusPicklistValues';



export default class TaskActivity extends NavigationMixin(LightningElement) {
    @track count = 'Task';
    @track tasks;
    @track filteredTasks = [];
    @track selectedStatus;
    @track statusOptions = [];
    isUpcomingSelected = 'neutral';
    isClosedSelected = 'neutral';
    isNoneSelected = 'neutral';
    @api recordId;
    @track ObjectForFile;
    @track ndata = false;
    @track noUpcomingTasks = false;
    @track noClosedTasks = false;
   

    
    @wire(getTasks, { recordId: '$recordId' })
    wiredTasks({ error, data }) {
        if (data) {
            this.tasks = data;
            this.ndata = this.tasks.length > 0;
            this.isUpcomingSelected='brand';
            this.showUpcomingTasks();
            this.ObjectForFile = data;
            this.count = data.length + ' Task';
            console.log('tasks=>',this.tasks);
           
        } else if (error) {
            console.error('Error fetching tasks:', error);
        }
        
    }

    @wire(getStatusPicklistValues)
    wiredStatusOptions({ error, data }) {
        if (data) {
            this.statusOptions = data.map(item => ({ label: item, value: item }));
            console.log('statusOptions=>', this.statusOptions);
        } else if (error) {
            console.error('Error fetching status picklist values:', error);
        }
    }
 

    handleTaskClick(event) {
        const taskId = event.currentTarget.dataset.id;
        this.navigateToTask(taskId);
    }

    navigateToTask(taskId) {
        const recordPageUrl = '/' + taskId;
        window.open(recordPageUrl, '_blank');
    }
    handleStatusChange(event) {
        this.selectedStatus = event.detail.value;
        // this.isUpcomingSelected = 'neutral';
        this.filterTasksByStatus();
    }

    filterTasksByStatus() {
        const currentDate = new Date();
        if (this.selectedStatus === '') {
            this.filteredTasks = this.tasks;
        } else {
            if ( this.isClosedSelected === 'brand') {
                // Filter out closed tasks excluding today's tasks
                const todayTasks = this.tasks.filter(task => {
                    const dueDate = new Date(task.Due_Date__c);
                    return dueDate.toDateString() === currentDate.toDateString();
                });
                this.filteredTasks = this.tasks.filter(task => {
                    const dueDate = new Date(task.Due_Date__c);
                    return dueDate < currentDate && !todayTasks.includes(task);
                }).filter(task => task.Status__c === this.selectedStatus);
            } else {
                if (this.isUpcomingSelected === 'brand') {
                    const futureTasks = this.tasks.filter(task => {
                        const dueDate = new Date(task.Due_Date__c);
                        return dueDate >= currentDate;
                    });
                    const todayTasks = this.tasks.filter(task => {
                        const dueDate = new Date(task.Due_Date__c);
                        return dueDate.toDateString() === currentDate.toDateString();
                    });
                    this.filteredTasks = [...todayTasks, ...futureTasks].filter(task => task.Status__c === this.selectedStatus);
                } else {
                    this.filteredTasks = this.tasks.filter(task => task.Status__c === this.selectedStatus);
                }
            }
        }
    }

    showUpcomingTasks() {
        this.isUpcomingSelected = 'brand';
        this.isClosedSelected = 'neutral';
        this.isNoneSelected='neutral';
        
        this.selectedStatus='';
        const currentDate = new Date();
        const todayTasks = [];
        const futureTasks = [];

        this.tasks.forEach(task => {
            const dueDate = new Date(task.Due_Date__c);
            if (dueDate > currentDate) {
                futureTasks.push(task);
            } else if (dueDate.toDateString() === currentDate.toDateString()) {
                todayTasks.push(task);
            }
        });

        // Concatenate today's tasks on top of future tasks
        this.filteredTasks = [...todayTasks, ...futureTasks];
        // Set noUpcomingTasks to true if there are no upcoming tasks
        this.noUpcomingTasks = this.filteredTasks.length === 0;
        this.noClosedTasks=false;
        
    }

    showClosedTasks() {
        if (this.isClosedSelected !== 'brand') {
            this.isUpcomingSelected = 'neutral';
            this.isClosedSelected = 'brand';
            this.isNoneSelected='neutral';
            this.selectedStatus = '';
            
            const currentDate = new Date();
            const todayTasks = [];
    
            // Filter out tasks due today
            this.filteredTasks.forEach(task => {
                const dueDate = new Date(task.Due_Date__c);
                if (dueDate.toDateString() === currentDate.toDateString()) {
                    todayTasks.push(task);
                }
            });
    
            // Filter out closed tasks excluding today's tasks
            this.filteredTasks = this.tasks.filter(task => {
                const dueDate = new Date(task.Due_Date__c);
                return dueDate < currentDate && !todayTasks.includes(task);
            });
            // Set noClosedTasks to true if there are no closed tasks
            this.noClosedTasks = this.filteredTasks.length === 0;
            this.noUpcomingTasks=false;
            
        }
    }
    
    
}